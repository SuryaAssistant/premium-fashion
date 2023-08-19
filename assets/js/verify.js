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
    let productName, productID, productDescription, productDate, manufacturePubKey, productSignature;
    let registeredName, registeredDate;

    let lastTime = 0;

    // Search first uploaded product information
    for (let i=0; i<tagIndexListCount; i++){
        if(blockchainData[i][1]["message"]["data"].hasOwnProperty("id")){
            // Get the timestamp
            if(lastTime == 0){
                lastTime = blockchainData[i][1]["message"]["timestamp"]
            }

            // Bandingkan timestamp
            if(blockchainData[i][1]["message"]["timestamp"] > lastTime){
                continue;
            }

            // Jika timestamp tidak lebih besar, ambil data
            productName = (blockchainData[i][1]["message"]["data"]["name"]);
            productID = (blockchainData[i][1]["message"]["data"]["id"]);
            productDescription = (blockchainData[i][1]["message"]["data"]["desc"]);
            productDate = new Date((blockchainData[i][1]["message"]["timestamp"])*1000);
            manufacturePubKey = (blockchainData[i][1]["publicKey"]);
            productSignature = (blockchainData[i][1]["signature"]);

        }
    }

    lastTime = 0;
    for (let i=0; i<tagIndexListCount; i++){
        if (blockchainData[i][1]["message"]["data"].hasOwnProperty("regName")){
            // Get the timestamp
            if(lastTime == 0){
                lastTime = blockchainData[i][1]["message"]["timestamp"]
            }

            // Bandingkan timestamp
            if(blockchainData[i][1]["message"]["timestamp"] > lastTime){
                continue;
            }
            
            registeredName = (blockchainData[i][1]["message"]["data"]["regName"])
            registeredDate = new Date(((blockchainData[i][1]["message"]["timestamp"]))*1000)
        }
    }


    // show the data in html
    document.getElementById("blockchain_data").innerHTML = `
    <!-- Product Title -->
    <div class="row">
        <div class="col">
                <span class="info-title">${productName}</span>
                <br>
                <span class="info-subtitle">ID : ${productID}</span>
        </div>
    </div>
    
    <br>

    <div class="row">
        <div class="col">
            <span class="form-key">MANUFACTURE : </span>
            <br><span>${manufacturePubKey}</span><br>
            <hr>
        </div>
    </div>
    <div class="row">
        <div class="col">
            <span class="form-key">SIGNATURE : </span>
            <br><span>${productSignature}</span><br>
            <!--
            <div class="row" id="signature-credential" style="text-align:right"> 
                <div class="col">
                    <button type="submit" class="btn btn-card mb-3" onclick="expandSign()">Verify Signature</button>
                </div>
            </div>
            -->
            <hr>
        </div>
    </div>
    <div class="row">
        <div class="col">
            <span class="form-key">MANUFACTURE DATE : </span>
            <br><span>${productDate}</span><br>
            <hr>
        </div>
    </div>
    <div class="row">
        <div class="col">
            <span class="form-key">PRODUCT DESCRIPTION : </span>
            <br><span>${productDescription}</span><br>
            <hr>
        </div>
    </div>
    `;


    if (registeredName === undefined){
        document.getElementById("blockchain_data").innerHTML += `
        <div class="row">
            <div class="col">
                <div class="row" style="text-align: right;">
                    <div class="mb-3">
                        <a href="./register.html"><button type="submit" class="btn btn-card mb-3">Claim Product</button></a>
                    </div>
                </div>
            </div>
        </div>
        `
    }

    else{
        document.getElementById("blockchain_data").innerHTML += `
        <!-- Product Ownership -->
        <div class="row">
            <div class="col">
                <span class="form-key">OWNERSHIP : </span>
                <br><span>${registeredName}</span><br>
                <hr>
            </div>
        </div>
        <div class="row">
            <div class="col">
                <span class="form-key">REGISTRATION DATE : </span>
                <br><span>${registeredDate}</span><br>
                <hr>
            </div>
        </div>

    
        <div class="row" style="padding-top:20px">
            <p>Read original data <a href="${indexedLink}">here</a></p>
        </div>
        `
    }

    // If there is no product with that id, claim the id
    if(productID === undefined){
        // show the data in html
        document.getElementById("blockchain_data").innerHTML = `
        <!-- Product Title -->
        <div class="row">
            <p>
            There is no product with this ID.
            </p>
        </div>
        <div class="row">
            <div class="col">
                <div class="row" style="text-align: right;">
                    <div class="mb-3">
                        <a href="./create-product.html"><button type="submit" class="btn btn-card mb-3">Claim ID</button></a>
                    </div>
                </div>
            </div>
        </div>
        
        `;
    }
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