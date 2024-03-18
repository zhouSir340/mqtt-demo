import time
import asyncio
import binascii
import json
from mqttClient import MqttClient
from mqttClient import Topic

config = {
    'broker': '127.0.0.1',
    'port': 1883,
    'username': 'user',
    'pwd': '123456',
    'thingName': 'thing_test'
}

async def main():
    client = MqttClient(config)

    client.connect()
    client.subscribe(client.get_topic(Topic.JOB_TOPIC))
    client.subscribe(client.get_topic(Topic.HEART_TOPIC))

    client.publish_heart_messages()

    client.loop_forever()

if __name__ == '__main__':
    try:
        asyncio.run(main())
    except Exception as e:
        raise e
    finally:
        asyncio.new_event_loop()