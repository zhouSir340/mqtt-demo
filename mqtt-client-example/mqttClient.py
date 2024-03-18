import paho.mqtt.client as mqtt
import time
import asyncio
import binascii
import json
from Crypto.Cipher import AES

class Topic():
    HEART_TOPIC = '/topic/heart'
    DATA_TOPIC = '/topic/data'
    JOB_TOPIC = '/things/{thingName}/job'
    UPDATE_JOB_STATUS_TOPIC = '/things/{thingName}/jobs/{jobId}/update'


class MqttClient():
    client = None
    
    def __init__(self, config):
        self.broker = config['broker']
        self.port = config['port']
        self.username = config['username']
        self.pwd = config['pwd']
        self.thingName = config['thingName']
        self.TIMEOUT_IN_SEC = 60
        self.encrypt_pwd = b'1234567887654321'

        self.client = mqtt.Client()

        self.client.on_connect = self.on_connect
        self.client.on_message = self.on_message

        self.client.username_pw_set(self.username, self.pwd)

    def encrypt(self, text):
        aes = AES.new(self.encrypt_pwd,AES.MODE_ECB)
        return aes.encrypt(text)
    
    def set_encrypt_pwd(self, pwd):
        self.encrypt_pwd = pwd
    
    def get_topic(self, topic, job_id=None):
        return topic.format(thingName=self.thingName, jobId=job_id)
    
    def on_connect(self, client, userdata, flags, rc):
        print(f"Connected with result code {rc}")

    def on_message(self, client, userdata, msg):
        print('receive data:{},topic:{}'.format(msg.payload, msg.topic))
        if msg.topic == self.get_topic(Topic.JOB_TOPIC):
            print('job message, check and do OTA...')
            self.on_job_new(msg.payload)
        elif msg.topic == self.get_topic(Topic.HEART_TOPIC):
            print('publish data to server')
            self.publish_heart_messages()

    def connect(self):
        self.client.connect(self.broker, self.port, self.TIMEOUT_IN_SEC)
        
    def subscribe(self, topic):
        print('subscribe to topic:{}'.format(topic))
        self.client.subscribe(topic)

    def publish(self, topic, payload):
        print('publish payload {} to topic {}'.format(payload, topic), flush=True)
        self.client.publish(topic, payload)

    def loop_forever(self):
        self.client.loop_forever()

    def on_job_new(self, payload):
        job = json.loads(payload.decode())['job']
        jobId = job['id']
        url = job['url']
        status = job['status']
        version = job['toVersion']

        ##download app file or something by url, and do ota, bla~bla~bla~

        if status == 'IN_PROGRESS':
            print('do OTA, wait 5 sec...',flush=True)
            time.sleep(5)
            data = {"version": version, "status": "SUCCEEDED", "ts": int(time.mktime(time.localtime()))}
            print('OTA succeeded, publish message...', flush=True)
            self.client.publish(self.get_topic(Topic.UPDATE_JOB_STATUS_TOPIC, jobId), json.dumps(data))

    def publish_heart_messages(self):
        data_text = json.dumps({'t': int(time.mktime(time.localtime()))}).replace(' ','').encode()
        encrypt_text = binascii.hexlify(self.encrypt(data_text)).decode()
        self.publish(self.get_topic(Topic.DATA_TOPIC), encrypt_text)
        print('publishing~~, 原文:{}, 密文:{}'.format(data_text, encrypt_text))