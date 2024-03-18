'use strict';

/**
 * Lib
 */
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();
const router = express.Router();
const fs = require('fs');
const mqtt = require('mqtt')
const CryptoJS = require('crypto-js')

let thingName = 'thing_test'
const HEART_TOPIC = '/topic/heart'
const DATA_TOPIC = `/topic/data`
const JOB_TOPIC = `/things/${thingName}/job`
const UPDATE_JOB_STATUS_TOPIC = `/things/${thingName}/jobs/+/update`
const MQTT_OPTIONS = {
    username: 'user',
    password: '123456'
}
const ENCRYPT_PWD = '1234567887654321'

function decryption(hexdata){
    let encryptedHexStr  = CryptoJS.enc.Hex.parse(hexdata);
    let encryptedBase64Str  = CryptoJS.enc.Base64.stringify(encryptedHexStr);
    let decryptedData  = CryptoJS.AES.decrypt(encryptedBase64Str, CryptoJS.enc.Utf8.parse(ENCRYPT_PWD), {
        mode: CryptoJS.mode.ECB,
        padding: CryptoJS.pad.NoPadding
    });
    return decryptedData.toString(CryptoJS.enc.Utf8);
}

// MQTT 客户端连接，获取设备端数据 or 发布数据
console.log('connect mqtt server')
const client = mqtt.connect("mqtt://127.0.0.1:1883",MQTT_OPTIONS)

client.on('connect', () => {
    console.log('mqtt connect successfully')
    client.subscribe(DATA_TOPIC,() => {
        console.log(`subscribe to topic: ${DATA_TOPIC}`)
    })
    client.subscribe(UPDATE_JOB_STATUS_TOPIC, () => {
        console.log(`subscribe to topic: ${UPDATE_JOB_STATUS_TOPIC}`)
    })
})

client.on('message', (topic, payload) => {
    if (topic === DATA_TOPIC){
        const message = decryption(payload.toString())
        console.log(`收到数据, topic:${topic}, 原文:${payload.toString()}, 解密后：${message}`)
        fs.appendFileSync('./db/messages.log', message+'\n')
    }

    else{
        //当前默认除了通讯数据外都是ota相关
        console.log(`收到数据, topic:${topic}, payload:${payload.toString()}`)
        const data = JSON.parse(payload)
        data['from'] = 'client'
        data['id'] = topic.split('/')[4]
        fs.appendFileSync('./db/ota.log', JSON.stringify(data)+'\n')
    }
})

function publish_job(payload){
    console.log(`publish job to ${JOB_TOPIC}`)
    client.publish(JOB_TOPIC, payload, { qos: 0, retain: false }, (error) => {
        if (error) {
          console.error(error)
        }
    })
}

function publish_message(){
    console.log(`publish data to ${HEART_TOPIC}`)
    client.publish(HEART_TOPIC, '', { qos: 0, retain: false }, (error) => {
        if (error) {
          console.error(error)
        }
    })
}



// HTTP API 
const API_KEY_NAME = "api_key";
const API_KEY_VALUE = "zhouSir";

// declare a new express app
router.use(cors());
router.use((req, res, next) => {
    bodyParser.json()(req, res, (err) => {
        if (err) {
            return res.status(400).json({
                code: 400,
                error: 'BadRequest',
                message: err.message,
            });
        }
        next();
    });
});
router.use(bodyParser.urlencoded({ extended: true }));

const validateApiKey = async (req, res, next) => {
    try {
        if (!req.headers[API_KEY_NAME] || req.headers[API_KEY_NAME] !== API_KEY_VALUE) {
            return res.status(401).json({
                code: 401,
                error: 'Unauthorized',
                message: 'Invalid API key',
            });
        }
        next();
    } catch (err) {
        return res
            .status(401)
            .json({ error: 'AccessDeniedException', message: err.message });
    }
}

const createOTAJob = async (req, res, next) => {
    const { body } = req;
    
    try {
        const {deviceId, toVersion} = body
        thingName = deviceId
        console.log(`request body: ${JSON.stringify(body)})`);
        if(deviceId && toVersion){
            // 校验设备id，版本等信息
            const payload = {
                "job":{
                    "id": `ota-random-${Math.round(Math.random() * 100)}`,
                    "url": "https://192.168.1.44",
                    "toVersion": toVersion,
                    "status": "IN_PROGRESS"
                }
            }
            publish_job(JSON.stringify(payload))
            payload['job']['from'] = 'server'
            fs.appendFileSync('./db/ota.log', JSON.stringify(payload['job'])+'\n')
            const result = {
                success: true
            }
            res.json(result);
        }
        else{
            return res.status(401).json({ success: false, message: 'something wrong.' });
        }
    } catch (err) {
        console.log(err)

        let status = err.code;
        return res.status(status).json(err);
    }
}

const getOTAJob = async(req, res, next) =>{
    const data = []
    try{
        const messages = fs.readFileSync('./db/ota.log', 'UTF-8');
        const lines = messages.split(/\r?\n/);
        lines.forEach((line) => {
            if(line){
                data.push(JSON.parse(line))
            }
        })
        const result = {
            'ota': data,
            'success': true
        }
        res.json(result);
    }catch (err) {
        console.log(err)

        let status = err.code;
        return res.status(status).json(err);
    }
}

const getMessages = async(req, res, next) =>{
    const data = []
    try{
        const messages = fs.readFileSync('./db/messages.log', 'UTF-8');
        const lines = messages.split(/\r?\n/);
        lines.forEach((line) => {
            if(line){
                data.push(JSON.parse(line))
            }
        })
        const result = {
            'messages': data,
            'success': true
        }
        res.json(result);
    }catch (err) {
        console.log(err)

        let status = err.code;
        return res.status(status).json(err);
    }
}

const sendMessages = async(req, res, next) => {
    try{
        publish_message()
        const result = {
            'success': true
        }
        res.json(result);
    }catch (err) {
        console.log(err)

        let status = err.code;
        return res.status(status).json(err);
    }
}


/****************************
 * methods *
 ****************************/

router.post('/ota/updates', validateApiKey, createOTAJob);
router.get('/ota/updates', validateApiKey, getOTAJob);
router.get('/messages', validateApiKey, getMessages)
router.post('/messages', validateApiKey, sendMessages)

app.use('/', router);

// Export the app object. When executing the application local this does nothing. However,
// to port it to AWS Lambda we will create a wrapper around that will load the app from
// this file
module.exports = app;