let companyPublicKey = "02fc8d163ee74b6e972bcc94481d0006f13c8e20896087fbfbda3ebc326ce2269b";
let indexedLink;
let tagIndexHash;

//======================================================================
// Function to call blockchain verifier
//======================================================================
function search(){
    // Get cloth id from user
    let productID = document.getElementById("search_product_id").value;

    // Get Keccak-256 hash of cloth id
    let productHash = (CryptoJS.SHA3(productID, { outputLength: 256 }).toString(CryptoJS.enc.Hex));

    // Create tag index for company
    let tagIndex = companyPublicKey + 'premium' + productHash;

    // Hash tag Index to shrink the size
    tagIndexHash = (CryptoJS.SHA3(tagIndex, { outputLength: 256 }).toString(CryptoJS.enc.Hex));
    indexedLink = "https://explorer.iota.org/devnet/indexed/" + tagIndexHash;

    //Connect MQTT for 
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

    // Send text index to MQTT
    let mqtt_msg = "tag_msg/" + tagIndexHash + '/' + returnTopic;
    
    let product_msg = new Paho.MQTT.Message(mqtt_msg);
    product_msg.destinationName = gatewayId + "/submit" ;
    mqtt.send(product_msg);

    document.getElementById("blockchain_data").innerHTML+=`
        <div class="row">
            <p>Searching data on blockchain . . .</p>
        </div>
    `;
}

function onFailure(){
    console.log("Failed to connect");
    setTimeout(MQTTconnect, reconnectTimeout);
}

// If gateway give response, display it
function onMessageArrived(msg){

    let IOTAResponse=msg.payloadString;
    IOTAResponse = IOTAResponse.replace(/'/g, '"');

    let blockchainData = JSON.parse(IOTAResponse)
    let tagIndexListCount = blockchainData.length;

    // Data to show
    let productName, productID, productDescription, productDate;
    let registeredName, registeredDate;

    let lastTime = 0;

    // Search first uploaded product information
    for (let i=0; i<tagIndexListCount; i++){
        if(blockchainData[i][0]["message"]["data"].hasOwnProperty("name")){
            // Get the timestamp
            if(lastTime == 0){
                lastTime = blockchainData[i][0]["message"]["timestamp"]
            }

            // Bandingkan timestamp
            if(blockchainData[i][0]["message"]["timestamp"] > lastTime){
                continue;
            }

            // Jika timestamp tidak lebih besar, ambil data
            productName = (blockchainData[i][0]["message"]["data"]["name"]);
            productID = (blockchainData[i][0]["message"]["data"]["id"]);
            productDescription = (blockchainData[i][0]["message"]["data"]["desc"]);
            productDate = new Date((blockchainData[i][0]["message"]["timestamp"])*1000);
        }
    }

    lastTime = 0;
    for (let i=0; i<tagIndexListCount; i++){
        if (blockchainData[i][0]["message"]["data"].hasOwnProperty("regName")){
            // Get the timestamp
            if(lastTime == 0){
                lastTime = blockchainData[i][0]["message"]["timestamp"]
            }

            // Bandingkan timestamp
            if(blockchainData[i][0]["message"]["timestamp"] > lastTime){
                continue;
            }
            
            registeredName = (blockchainData[i][0]["message"]["data"]["regName"])
            registeredDate = new Date(((blockchainData[i][0]["message"]["timestamp"]))*1000)
        }
    }


    // show the data in html
    document.getElementById("blockchain_data").innerHTML = `
        <div class="row">
            <p><b>Product Information</b></p>
            <p>
                Product Name : ${productName}<br>
                Product ID : ${productID}<br>
                Product Description : ${productDescription}<br>
                Manufactured Date : ${productDate}<br>
            </p>
        </div>
        <div class="row" style="padding-top:20px">
            <p><b>Registration Information</b></p>
            <p>
                Registered Name : ${registeredName}<br>
                Registration Date : ${registeredDate}<br>
            </p>
        </div>
        <div class="row" style="padding-top:20px">
            <p>Read original data here <a href="${indexedLink}">here</a></p>
        </div>
    `;
}

// connect to mqtt
function MQTTconnect(){
    console.log("connecting MQTT");
    mqtt = new Paho.MQTT.Client(host,port,"clientjs");

    var options = {
        timeout: 3,
        onSuccess: onConnect,
        onFailure: onFailure,
    };

    mqtt.onMessageArrived = onMessageArrived;
    mqtt.connect(options);
}