let companyPublicKey = "02fc8d163ee74b6e972bcc94481d0006f13c8e20896087fbfbda3ebc326ce2269b";
let regJSON
let tagIndexHash;

//======================================================================
// Function to get data from form
//======================================================================
function register(){
    // Get product information
    let productID = document.getElementById("inputID").value;
    let registeredName = document.getElementById("inputName").value;

    // Create special JSON format
    regJSON = "{'regName':'"+registeredName+"'}"
    
    // Get Keccak-256 hash of product ID
    let productHash = CryptoJS.SHA3(productID, { outputLength: 256 }).toString(CryptoJS.enc.Hex);

    // Create tag index for company
    let tagIndex = companyPublicKey + 'premium' + productHash;

    // Hash tag Index to shrink the size
    tagIndexHash = CryptoJS.SHA3(tagIndex, { outputLength: 256 }).toString(CryptoJS.enc.Hex);

    // Prepare MQTT connection to gateway
    MQTTconnect();

    document.getElementById("blockchain_data").innerHTML=`
        <div class="row">
            <p>Create a connection with gateway . . .</p>
        </div>
    `;
}

//======================================================================
// MQTT Function
//======================================================================
// When user is connect to mqtt, subscribe randomized topic and send 
function onConnect(){
    // Subscribe topic
    mqtt.subscribe(topic);

    document.getElementById("blockchain_data").innerHTML+=`
        <div class="row">
            <p>Sending information to gateway . . .</p>
        </div>
    `;

    // Send submit request to gateway
    // format : submit_special/tag_index/data/return_topic
    let mqtt_msg = "data_special/" + tagIndexHash + '/' + regJSON + '/'+ returnTopic;
    
    let product_msg = new Paho.MQTT.Message(mqtt_msg);
    product_msg.destinationName = gatewayId + "/submit" ;
    mqtt.send(product_msg);

    document.getElementById("blockchain_data").innerHTML+=`
        <div class="row">
            <p>Uploading ownership metadata to blockchain . . .</p>
            <p>Please wait. It may take 1-2 minute</p>
        </div>
    `;
}

function onFailure(){
    console.log("Failed to connect");
    setTimeout(MQTTconnect, reconnectTimeout);
}

// If gateway give response, display it
function onMessageArrived(msg){
    IOTAResponse=msg.payloadString;

    document.getElementById("blockchain_data").innerHTML = `
        <div class="row">
            <p>Product ownership registered successfully at </p>
            <p><a href="https://explorer.iota.org/devnet/indexed/${IOTAResponse}">${IOTAResponse}</a></p>
        </div>
    `;
}

// Function to start a connection to MQTT broker
function MQTTconnect(){
    console.log("connecting MQTT");
    mqtt = new Paho.MQTT.Client(host,port,"webpremiumfashion");

    var options = {
        timeout: 3,
        onSuccess: onConnect,
        onFailure: onFailure,
    };

    mqtt.onMessageArrived = onMessageArrived;
    mqtt.connect(options);
}