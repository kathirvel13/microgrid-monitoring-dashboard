"use client"

import mqtt from "mqtt"

const brokerUrl = "wss://broker.emqx.io:8084/mqtt"

export const mqttClient = mqtt.connect(brokerUrl)

mqttClient.on("connect", () => {
  console.log("Connected to MQTT Broker")

  mqttClient.subscribe("battery/data", (err) => {
    if (!err) {
      console.log("Subscribed to battery/data")
    }
  })
})

mqttClient.on("error", (err) => {
  console.log("MQTT Error:", err)
})