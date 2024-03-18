import { useState } from 'react'
import icon from './assets/icon.svg'
import server from './assets/server.svg'
import './App.css'
import axios from 'axios'
import { Flex, Button, Modal, message, List, Avatar, Select } from 'antd'

function App() {  
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [isOTAModalOpen, setIsOTAModalOpen] = useState(false);
  const [isCreateOTAModalOpen, setIsCreateOTAModalOpen] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  const [messages, setMessages] = useState([])
  const [otaMessages, setOtaMessages] = useState([])
  const [targetVersion, setTargetVersion] = useState('0.0.1')

  const getMessageAndShowMessageModal = () => {
    axios.get('http://192.168.1.44:3030/messages',{
      headers:{"api_key": "zhouSir"}
    })
    .then((res) => {
      console.log(res.data)
      setMessages(res.data.messages)
    })
    .catch((err) => {
      console.log(err)
      messageApi.error('something wrong')
    })
    .finally(() => {
      setIsMessageModalOpen(true);
    })
  };

  const handleShowMessageModalCancel = () => {
    setIsMessageModalOpen(false);
  }

  const getOTAAndShowOTAModal = () => {
    axios.get('http://192.168.1.44:3030/ota/updates',{
      headers:{"api_key": "zhouSir"}
    })
    .then((res) => {
      console.log(res.data)
      setOtaMessages(res.data.ota)
    })
    .catch((err) => {
      console.log(err)
      messageApi.error('something wrong')
    })
    .finally(() => {
      setIsOTAModalOpen(true);
    })
  };

  const handleShowOTAModalCancel = () => {
    setIsOTAModalOpen(false);
  }

  const showCreateOtaModal = () => {
    setIsCreateOTAModalOpen(true)
    handleShowOTAModalCancel()
  }

  const handleShowCreateOtaModalCancel = () => {
    setIsCreateOTAModalOpen(false)
  }

  const handleTargetVersionChange = (value: string) => {
    setTargetVersion(value)
  }

  const createOtaJob = () => {
    axios.post('http://192.168.1.44:3030/ota/updates',{
      "deviceId": "thing_test",
      "toVersion":targetVersion
    },{
      headers:{"api_key": "zhouSir"},
    })
    .then((res) => {
      console.log(res.data)
      messageApi.success('创建OTA作业成功')
      setIsCreateOTAModalOpen(false)
    })
    .catch((err) => {
      console.log(err)
      messageApi.error('error in create OTA job')
    })
    .finally(() => {
      
    })
  }

  const handleReportHeartBreak = () => {
    axios.post('http://192.168.1.44:3030/messages',{}, {
      headers:{"api_key": "zhouSir"}
    })
    .then((res) => {
      console.log(res.data)
      messageApi.success('执行成功，请稍后在通讯记录中确认数据')
    })
    .catch((err) => {
      console.log(err)
      messageApi.error('error in handle report heartbreak')
    })
    .finally(() => {
      
    })
  }

  return (
    <>
      {contextHolder}
      <div>
        <img src={icon} className="logo" onClick={handleReportHeartBreak}/>
      </div>
      <h1>售货机通讯项目</h1>
      <span>点击售货机图标控制设备发送心跳包</span>
      <div className="card">
        <Flex>
            <Button type='primary' size='large' onClick={getMessageAndShowMessageModal}>通讯记录</Button>
            <Button size='large' onClick={getOTAAndShowOTAModal}>OTA</Button>
        </Flex>
      </div>



      <Modal title="通讯记录" open={isMessageModalOpen} footer={null} onCancel={handleShowMessageModalCancel}>
        <List
          itemLayout="horizontal"
          dataSource={messages}
          renderItem={(item, index) => (
            <List.Item>
              <List.Item.Meta
                avatar={<Avatar src={icon}/>}
                title={<span>{JSON.stringify(item)}</span>}
              />
            </List.Item>
          )}
        />
      </Modal>
      <Modal title="OTA" open={isOTAModalOpen} footer={null} onCancel={handleShowOTAModalCancel}>
        <List
          itemLayout="horizontal"
          dataSource={otaMessages}
          renderItem={(item, index) => (
            <List.Item>
              <List.Item.Meta
                avatar={<Avatar src={item['from'] === 'client' ? icon : server}/>}
                title={<span>{JSON.stringify(item)}</span>}
              />
            </List.Item>
          )}
        />

        <Flex>
          <Button onClick={showCreateOtaModal}>创建新的OTA作业</Button>
        </Flex>
        
      </Modal>


      <Modal title="创建OTA作业" open={isCreateOTAModalOpen} footer={null} onCancel={handleShowCreateOtaModalCancel}>
        <br/><br/>
        <Flex>
          <span style={{width: "50%"}}>选择目标版本</span>
          <Select
            defaultValue="0.0.1"
            style={{ width: "50%" }}
            onChange={handleTargetVersionChange}
            options={[
              { value: '0.0.1', label: '0.0.1' },
              { value: '0.0.2', label: '0.0.2' },
              { value: '0.0.3', label: '0.0.3' },
              { value: '1.0.0', label: '1.0.0' },
            ]}
          />
        </Flex>
        <br/><br/>
        <div style={{textAlign: "center"}}>
          <Button type='primary' style={{width:"25%"}} onClick={createOtaJob}>创建</Button>
        </div>
      </Modal>
    </>
  )
}

export default App
