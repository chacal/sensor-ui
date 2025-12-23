# Sensor UI

This project is a simple web-based UI for displaying real-time sensor data. It consists of a Node.js backend that subscribes to an MQTT broker and a frontend that displays the data received from the backend via a WebSocket connection.

## Features

-   Real-time display of sensor data.
-   WebSocket-based communication for low-latency updates.
-   Automatic reconnection to the WebSocket server.
-   Clean and modern user interface.
-   Highlights sensors with low battery voltage or stale data.

## Technology Stack

-   **Backend**: Node.js, Express, ws, MQTT.js
-   **Frontend**: HTML, CSS, JavaScript

## Getting Started

### Prerequisites

-   Node.js and npm installed.
-   An MQTT broker that the backend can connect to.

### Installation and Running

1.  Clone the repository:
    ```bash
    git clone https://github.com/chacal/sensor-ui.git
    cd sensor-ui
    ```

2.  Install the dependencies:
    ```bash
    npm install
    ```

3.  Set the required environment variables for the MQTT broker connection. You can do this by creating a `.env` file in the root of the project:
    ```
    MQTT_HOST=your_mqtt_broker_host
    MQTT_PORT=your_mqtt_broker_port
    MQTT_USERNAME=your_mqtt_username
    MQTT_PASSWORD=your_mqtt_password
    ```

4.  Start the server:
    ```bash
    npm start
    ```

5.  Open your browser and navigate to `http://localhost:3000`.

## License

This project is licensed under the MIT License.
