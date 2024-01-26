//nav menu
function myFunction() {
  var element = document.getElementById("myDIV");
  element.classList.toggle("show");
}

let communication;
let loaderShow=false;
let department;
let allMessages = []
var conId
let userData
let formData = {}
let callSelection
async function fetchApi() {
  let response = await fetch("http://localhost:8000/core/setting/");
  const data = await response.json();
  localStorage.setItem('setting', JSON.stringify(data));
}

async function fetchToken() {
  let response = await fetch(`http://localhost:8000/core/twilio_video_access_token/?user_identity=${formData.customer_email}&room_name=${formData.customer_email}`);
  const data = await response.json();
  console.log(data.token)
  return data.token;

}



const ChatModule = (function () {

  let conversationsClient

  let conversation;





  const initialize = async (token) => {
    try {
      showLoader(); 
   
      const client = new Twilio.Conversations.Client(token);
      try {

        client.on('initialized', () => {
          conversationsClient = client
          hideLoader();
        })
       

        client.on('connectionStateChanged', (state) => {
          conversationsClient = client
          if (state === 'connecting') {
            showLoader();
            console.log('Connecting to Twilio…')

          }
         
          if (state === 'connected') {
            console.log('You are connected.')
            
            console.log("conId", conId)
            console.log("I am here", conversationsClient)
            if (conversationsClient) {
              console.log("AM I HERE")
              handleJoinConversation(conId, 3000)
            }
          }
         
          if (state === 'disconnecting') {
            console.log('Disconnecting from Twilio…')

          }
          if (state === 'disconnected') {
            console.log('Disconnected.')

          }
          if (state === 'denied') {
            console.log('Failed to connect.')

          }
        })

        if (client) {
          console.log("convoclient", conversationsClient)
          client.on('messageAdded', (message) => {
            console.log('New message added:', message)
            console.log("hitt", message)
            let agentMessage
            if (message.author !== formData.customer_email) {
              console.log("author")
              agentMessage = message.body
              console.log(`New message received from agent: ${agentMessage}`);

              const messageDiv = document.createElement('div');
              messageDiv.classList.add('second-chat')
              messageDiv.innerHTML = `
              <div class="circle"></div>
              <p>${agentMessage}</p>
               <div class="arrow"></div>
              <br/>
                `
              const messageBox = document.getElementById("newMessageBox");
              messageBox.appendChild(messageDiv);

              var objDiv = document.getElementById("newMessageBox");
              objDiv.scrollTop = objDiv.scrollHeight;

            }


          })
        }
      } catch (error) {
        console.error('Error initializing ConversationsClient:', error)
      }
      // chatClient = await Chat.Client.create(token);
    } catch (error) {
      console.error('Error initializing Chat client:', error);
    }
      finally {
        hideLoader();
// Hide loader in case of an error
      }
    };


  const handleJoinConversation = async (conversationSid, retryDelay) => {
    console.log("Trying to join conversation with SID:", conversationSid);

    let existingConversation;
    try {
      if (conversationsClient) {
        console.log("Conversations client is present. Attempting to get conversation...");
        existingConversation = await conversationsClient.getConversationBySid(`${conversationSid}`);
      } else {
        console.log("Conversations client is not present. Skipping conversation retrieval.");
      }

      console.log('Conversation:', existingConversation);

      if (existingConversation) {
        console.log("done1")
        for (let attempt = 1; attempt <= 3; attempt++) {

          try {
            await existingConversation.join()

            console.log('Successfully joined conversation.', existingConversation);
            conversation = existingConversation;
            break;



          } catch
          (e) {
            console.log(e)
            if (attempt < 3) {
              console.log(`Retrying in ${retryDelay} milliseconds...`);
              sleep(retryDelay);
            } else {
              console.error(`Max retries reached. Unable to join the conversation.`);
              throw error; // Re-throw the error if max retries are reached
            }
          }
        }

      } else {
        console.error(`Conversation with SID ${conId} not found.`);
      }
    } catch (error) {
      console.error('Error joining conversation:', error);
    }
  };

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }



  console.log('invoked')
  const sendMessage = async (message) => {
    console.log(conversation, message)
    try {
      conversation && await conversation.sendMessage(message)
      console.log('Message Sent', message)
    } catch (error) {
      console.error('Error sending message:', error);
    }

  }



  return {
    initialize,
    // createOrJoinChannel,
    sendMessage,
  };
})();



function handleChatInitialization() {
  fetchToken().then(async (token) => {
    await ChatModule.initialize(token);

  });
}



const showLoader = () => {
  loaderShow=true;
  console.log("Showing Loader")
  const loader = document.getElementById("loader");
  const divWindow3 = document.getElementById("divWindow3");

  if (loader && divWindow3) {
    // Position the loader relative to divWindow3
    // loader.style.position = "absolute";
    // loader.style. = divWindow3.offsetTop + "100px";
    // loader.style.left = divWindow3.offsetLeft + "200px";

    loader.style.display = "block";
  }
};

const hideLoader = () => {
  loaderShow=false;
  const loader = document.getElementById("loader");
  if (loader) {
    loader.style.display = "none";
  }
};

document.addEventListener("DOMContentLoaded", function () {
  // Initialize the phone number input with international format
  const phoneNumberInput = document.getElementById("phoneNumber");
  const iti = window.intlTelInput(phoneNumberInput, {
    utilsScript: "https://cdnjs.cloudflare.com/ajax/libs/intl-tel-input/17.0.12/js/utils.js",
  });

  // Update the hidden input with the selected country code
  phoneNumberInput.addEventListener("countrychange", function () {
    const countryCode = iti.getSelectedCountryData().iso2;
    document.getElementById("countryCode").value = countryCode;
  });
});




function getFormData() {

  const name = document.getElementById("name").value;
  const email = document.getElementById("email").value;
  const phoneNumber = document.getElementById("phoneNumber").value;

  // Check if all required fields are filled
  if (name && email && phoneNumber) {
    formData = {
      customer_name: name,
      customer_email: email,
      customer_phone_number: phoneNumber,
      // customer_query_department:queryDepartment,
      // customer_query_service:queryService
    };
    openConversation()
    console.log("Form Data:", formData);




    // Perform additional actions with formData if needed
  } else {
    alert("Please fill out all required fields.");
    // openConversation()
  }
}

const postCustomerData = (data) => {
  // Create a new XMLHttpRequest
  const xhr = new XMLHttpRequest();
  xhr.open('POST', 'http://localhost:8000/core/customer/', true);
  xhr.setRequestHeader('Content-Type', 'application/json');

  // Define the function to handle the response
  xhr.onload = function () {
    if (xhr.status === 200) {
      // console.log('Server response:', JSON.parse(xhr.responseText));
      localStorage.setItem('userData', JSON.stringify(data))
      var responseObject = JSON.parse(xhr.responseText);
      console.log("responseObject===>", responseObject)
      conId = responseObject.data.conversation_id
      console.log("conversationId", conId, responseObject.data)
      // Handle the server response as needed
    } else {
      alert("Error sending form data.");
      console.error('Error sending form data. Server responded with:', xhr.status, xhr.statusText);
    }
  };

  // Convert the form data to JSON and send it
  xhr.send(JSON.stringify(data));

} 



fetchApi()



const data = JSON.parse(localStorage.getItem('setting'));

let audio1 = new Audio(
  "https://s3-us-west-2.amazonaws.com/s.cdpn.io/242518/clickUp.mp3"
);
function chatOpen() {
  document.getElementById("chat-open").style.display = "none";
  document.getElementById("chat-close").style.display = "block";
  document.getElementById("chat-window1").style.display = "block";

  audio1.load();
  audio1.play();
}
function chatClose() {
  document.getElementById("chat-open").style.display = "block";
  document.getElementById("chat-close").style.display = "none";
  document.getElementById("chat-window1").style.display = "none";
  document.getElementById("chat-window2").style.display = "none";
  document.getElementById("chat-window3").style.display = "none";

  audio1.load();
  audio1.play();
}
function openConversation() {
  document.getElementById("chat-window2").style.display = "block";
  document.getElementById("chat-window1").style.display = "none";

  audio1.load();
  audio1.play();
}

function handleWebChat() {
  userData = JSON.parse(localStorage.getItem('userData'))
  console.log("USERDATA FROM localstorage", userData)
  document.getElementById("chat-window3").style.display = "block";
  document.getElementById("chat-window2").style.display = "none";


  document.getElementById("newMessageBox").innerHTML +=
    `
  <div class="hi-there">
    <p class="p1">Welcome ${userData.customer_name}</p>
    <br />
    <p class="p2">The team typically replies in few minutes.</p>
  </div>
  <br/>
   <div class="second-chat">
    <div class="circle"></div>
    <p>How can I help you?</p>
    <div class="arrow"></div>
  </div>
  <div class="loader"  id="loader"></div>
  `


  const channelName = `${formData.customer_email}11223344`;

  audio1.load();
  audio1.play();


}

//Gets the text from the input box(user)
function userResponse(data) {

  // let Data = false; // Initialize Data as false
  const excludedItems = ['videocall', 'voicecall'];

  if (data && !["sms", "call", "webchat", "whatsapp"].includes(data.toLowerCase())) {
    // Data = true;
    formData = { ...formData, customer_query_department: data,};
  }
  console.log("User form dataDEDEDEDED", formData);
  let userText = document.getElementById("textInput").value;

  if (data) {
    document.getElementById("messageBox").innerHTML += `<div class="first-chat">
      <p>${data}</p>
      <div class="arrow"></div>
    </div>`;
    if (data.toLowerCase() === "webchat") {
      Data = true;
      // window.location.href = `http://localhost:3000/videocall?token=${token}&roomname=${userData.customer_email}`;
   postCustomerData(formData)
   handleChatInitialization()

    !loaderShow&&  handleWebChat()

    } else if (data.toLowerCase() === "sms") {
      Data = true;
      postCustomerData(formData)
      document.getElementById("messageBox").innerHTML += `<div class="first-chat">
      <p>You will be contacted shortly by one of our Customer Care Representatives via text SMS on ${formData.customer_phone_number}</p>
      <div class="arrow"></div>
    </div>`;

    }
    else if (data.toLowerCase() === "call") {
      document.getElementById("messageBox").innerHTML += `<div class="first-chat">
      <p>How do you want to be contacted, via audio or video call?</p>
      <div class="arrow"></div>
    </div>;
      <div class="second-chat">
        <div class="circle"></div>
        <select name="callSelection" id="callSelection" onChange="handleCallSelection(event)">
          <option>Choose an option</option>
          ${botSettings.setting.thirdResponse.options
          .filter(item => excludedItems.includes(item)) // Exclude items
          .map((item, index) => `
    <option value="${item}" key="${index}">${item}</option>
  `)
          .join('')}
        </select>


      </div>`

      var objDiv = document.getElementById("messageBox");
      objDiv.scrollTop = objDiv.scrollHeight;

    } else {
      setTimeout(() => {
        adminResponse();
      }, 1000);
    }
  } else if (userText) {
    document.getElementById("messageBox").innerHTML += `<div class="first-chat">
      <p>${userText}</p>
      <div class="arrow"></div>
    </div>`;
    let audio3 = new Audio(
      "https://prodigits.co.uk/content/ringtones/tone/2020/alert/preview/4331e9c25345461.mp3"
    );
    audio3.load();
    audio3.play();

    document.getElementById("textInput").value = "";
    var objDiv = document.getElementById("messageBox");
    objDiv.scrollTop = objDiv.scrollHeight;

    setTimeout(() => {
      adminResponse();
    }, 1000);
  } else {
    return
  }
}
//creat user message

//admin Respononse to user's message
function adminResponse() {
  const excludedItems = ['videocall', 'voicecall', 'true'];


  document.getElementById(
    "messageBox"
  ).innerHTML +=
    `<div class="second-chat" style=${botSettings.setting.botMessageBackground}>
          <div class="circle" id="circle-mar"></div>
          <p>${botSettings.setting.thirdResponse.message}</p>
          <div class="arrow"></div>
    </div>
        <div class="second-chat">
        <div class="circle"></div>
        <select name="communication" id="communication"  onChange="handleCommunicationChange(event)">
      <option>Choose an option</option>
     ${botSettings.setting.thirdResponse.options
      .filter(item => !excludedItems.includes(item)) // Exclude items
      .map((item, index) => `
    <option value="${item}" key="${index}">${item}</option>
  `)
      .join('')}
    </select>
    
        
      </div>
      `;
  let audio3 = new Audio(
    "https://downloadwap.com/content2/mp3-ringtones/tone/2020/alert/preview/56de9c2d5169679.mp3"
  );
  audio3.load();
  audio3.play();
  document.getElementById("communication").addEventListener("change", (e) => {
    communication = e.target.value
    console.log(communication)
    formData = { ...formData, customer_query_service: communication ,schedule:false}
    console.log("response", formData);
    //  postCustomerData(formData)
    userResponse(communication)
  })


  var objDiv = document.getElementById("messageBox");
  objDiv.scrollTop = objDiv.scrollHeight;
}




//press enter on keyboard and send message
// Listen for keypress events
addEventListener("keypress", (event) => {
  // Check if the pressed key is Enter
  if (event.key === "Enter") {
    // Check if the "textInput" element exists and is focused
    const textInput = document.getElementById("textInput");
    if (textInput && textInput === document.activeElement) {
      // Trigger the userResponse function
      handleThirdWindow()
    }
  }
});


// let loader = document.createElement('div');
// loader.setAttribute('class','loader')
// loader.setAttribute("id",'loader')


let divOpen = document.createElement('div');
divOpen.setAttribute('class', 'chat-bar-open');
divOpen.setAttribute('id', 'chat-open');

let buttonOpen = document.createElement('button');
buttonOpen.setAttribute('id', 'chat-open-button');
buttonOpen.setAttribute('type', 'button');
buttonOpen.setAttribute('class', 'collapsible close');
buttonOpen.setAttribute('onclick', 'chatOpen()');

let img1 = document.createElement('img');
img1.src = 'assets/images/Sparrow Bird.png';
img1.setAttribute('alt', 'Sparrow Bird image');

buttonOpen.appendChild(img1);
divOpen.appendChild(buttonOpen);

let divClose = document.createElement('div');
divClose.setAttribute('class', 'chat-bar-close');
divClose.setAttribute('id', 'chat-close');

let buttonClose = document.createElement('button');
buttonClose.setAttribute('id', 'chat-close-button');
buttonClose.setAttribute('type', 'button');
buttonClose.setAttribute('class', 'collapsible close');
buttonClose.setAttribute('onclick', 'chatClose()');

let i1 = document.createElement('i');
i1.setAttribute('class', 'material-icons-outlined');
i1.innerHTML = ' close ';

buttonClose.appendChild(i1);
divClose.appendChild(buttonClose);




let botSettings = JSON.parse(localStorage.getItem("setting"))
console.log("botSettings", botSettings.setting)




let divWindow1 = document.createElement('div');
divWindow1.setAttribute('class', 'chat-window');
divWindow1.setAttribute('id', 'chat-window1');
divWindow1.innerHTML += `

<div class="hi-there">
  <p class="p1">${botSettings.setting.botTitle}</p>
  <br />
  <p class="p2">${botSettings.setting.firstResponse.greetingMessage}<br /></p>
</div>
<div class="start-conversation">

 <form id="myForm">
    <div class="inputDirection">
      <label htmlFor="name" class="labelStyle">Name*</label>
      <input id="name" class="inputStyle" type="text" required="true"/>
    </div>
    <div class="inputDirection">
      <label htmlFor="email" class="labelStyle">Email*</label>
      <input id="email" type="email" class="inputStyle" required="true"/>
    </div>
    <div class="inputDirection">
      <label htmlFor="phoneNumber" class="labelStyle">Phone Number*</label>
      <input id="phoneNumber" type="tel" class="inputStyle" required="true"/>
    </div>
   
     <button
    class="new-conversation"
    type="button"
    onclick="getFormData()"
  >
    <span>Continue</span
    ><i class="material-icons-outlined"> send </i>
  </button>
  </form>


 
</div>

`

let divWindow2 = document.createElement('div');
divWindow2.setAttribute('class', 'chat-window2');
divWindow2.setAttribute('id', 'chat-window2');
divWindow2.innerHTML += `

<div class="message-box" id="messageBox">
  <div class="hi-there">
      <p class="p2">Welcome  <b>${formData?.customer_name}</b></p><br/>
    <p class="p2">Please choose from options provided below. </p>
  </div>
  <br/>
  <div class="second-chat" style=${botSettings.setting.botMessageBackground}>
    <div class="circle"></div>
    <p>${botSettings.setting.secondResponse.message}</p>
    <div class="arrow"></div>
  </div>

  <div class="second-chat select-Container">
    <div class="circle"></div>
   <select name="departments" id="departments" onchange="handleDepartmentChange(event)">
      <option>Choose an option</option>
      ${botSettings.setting.secondResponse.options.map((item, index) => `
        <option value="${item}" key="${index}">${item}</option>
      `).join('')}
    </select>

  </div>


</div>


`


let divWindow3 = document.createElement('div');
divWindow3.setAttribute('class', 'chat-window2');
divWindow3.setAttribute('id', 'chat-window3');
divWindow3.innerHTML += `

<div class="message-box" id="newMessageBox">

 

  


</div>
<div class="input-box">

  <div class="write-reply">
    <input
      class="inputText"
      type="text"
      id="textInput"
      placeholder="Write a reply..."
    />
  </div>
  <div class="send-button">
    <button
      type="submit"
      class="send-message"
      id="send-button"
      onClick="handleThirdWindow()"
    >
      <i class="material-icons-outlined"> send </i>
    </button>
  </div>
</div>

`





document.body.appendChild(divOpen);
document.body.appendChild(divClose);
document.body.appendChild(divWindow1);
document.body.appendChild(divWindow2);
document.body.appendChild(divWindow3);
// document.body.appendChild(loader)


const sendButton = document.getElementById('send-button');
const messageInput = document.getElementById('textInput');



const handleThirdWindow = () => {
  const message = messageInput.value;
  const messageDiv = document.createElement('div');
  // sendButton.addEventListener('click', () => {
  if (message) {

    messageDiv.classList.add('first-chat')
    messageDiv.innerHTML = `
    <p>${message}</p>
    <div class="arrow"></div>
  `
    console.log("inside");
    ChatModule.sendMessage(message);
    messageInput.value = '';
  } else {
    console.log("Input field is empty");
  }



  console.log(message, allMessages);


  const messageBox = document.getElementById("newMessageBox");
  messageBox.appendChild(messageDiv);

  var objDiv = document.getElementById("newMessageBox");
  objDiv.scrollTop = objDiv.scrollHeight;

  ;


};


document.getElementById("departments").addEventListener("change", (e) => {
  department = e.target.value
  console.log("department",department)

  userResponse(department)
})

let departmentSelected = false;


function handleDepartmentChange(e) {

  const selectedOption = e.target.value;
  if (selectedOption && !departmentSelected) {

    departmentSelected = true;

    document.getElementById('departments').disabled = true;

  }

}

let communicationSelected = false;

function handleCommunicationChange(e) {

  const selectedOption = e.target.value;
  if (selectedOption && !communicationSelected) {

    communicationSelected = true;

    document.getElementById('communication').disabled = true;

  }

}


let callSelected = false;
function handleCallSelection(e) {
  console.log("callSelection event changer hit")
  callSelection = e.target.value;
  formData={...formData,customer_query_service:callSelection}
  if (callSelection && !callSelected) {
    callSelected = true;
    document.getElementById('callSelection').disabled = true;

  }
  callOptions(callSelection)

}
let schedule
let callSchedule = false;
function handleCallSchedular(e,tag) {
 
  schedule = e.target.value;
formData={...formData,schedule:schedule}

  console.log("callSchedular event changer hit",schedule)
  if (schedule && !callSchedule) {
    callSchedule = true;
    document.getElementById('schedular').disabled = true;

  }
if(schedule==="false")
{
  console.log("Calling Now")
  
  postCustomerData(formData)
  schedular(schedule,tag)

}else{

  // document.getElementById("messageBox").innerHTML += `<div class="first-chat">
  //     <p>${schedule}</p>
  //     <div class="arrow"></div>
  //   </div>;`
  schedular(schedule,tag)
  console.log("callSchedular event changer hit",formData)
}
  var objDiv = document.getElementById("messageBox");
  objDiv.scrollTop = objDiv.scrollHeight;
  
}

function scheduleVoiceCall() {
  // Get the selected date and time from the dropdowns
  const scheduledDate = document.getElementById("scheduleDate").value;
  const formattedTime = document.getElementById("scheduleTime").value;
  const formattedTimeWithPeriod = convertTo12HourFormat(formattedTime);
  // Create an object to store the scheduled date and time
  const scheduledInfo = {
    date: scheduledDate,
    time: formattedTimeWithPeriod,
  };

  // Display a confirmation message
  let confirmationMessage = `Your Call has been scheduled for ${scheduledInfo.date} at ${scheduledInfo.time}`;
  document.getElementById("messageBox").innerHTML += `
    <div class="first-chat">
      <p>${confirmationMessage}</p>
      <div class="arrow"></div>
    </div>`;

  var objDiv = document.getElementById("messageBox");
  objDiv.scrollTop = objDiv.scrollHeight;

  let data = { ...formData, date: scheduledInfo.date, time: scheduledInfo.time };

  // Send the scheduled date and time to the server
  postCustomerData(data);
  console.log("Data to be sent ", data);

  // Clear the date and time inputs after scheduling
  document.getElementById("scheduleDate").value = "";
  document.getElementById("scheduleTime").value = "";
}



function callOptions(data) {
  if (data === "voicecall") {
    document.getElementById("messageBox").innerHTML += `<div class="first-chat">
      <p>Do you want to call now or schedule it for later?</p>
      <div class="arrow"></div>
    </div>;
      <div class="second-chat">
        <div class="circle"></div>
        <select name="schedular" id="schedular" onChange="handleCallSchedular(event,'voice')">
          <option>Choose an option</option>
    <option value=false >Call Now</option>
   <option value=true>Schedule for later</option>
        </select>
      </div>`

  }
  
  else if (data === "videocall") {

    document.getElementById("messageBox").innerHTML += `<div class="first-chat">
      <p>Do you want to call now or schedule it for later?</p>
      <div class="arrow"></div>
    </div>;
      <div class="second-chat">
        <div class="circle"></div>
        <select name="schedular" id="schedular" onChange="handleCallSchedular(event,'video')">
          <option>Choose an option</option>
          <option value=false>Call Now</option>
          <option value=true>Schedule for later</option>
        </select>
      </div>`
  }
  var objDiv = document.getElementById("messageBox");
  objDiv.scrollTop = objDiv.scrollHeight;

}

function formattedTime(selectedTime) {
  const formatted = convertTo12HourFormat(selectedTime);
  // Display the formatted time in your UI if needed
  console.log("Formatted Time:", formatted);
}

function convertTo12HourFormat(time24) {
  const [hours, minutes] = time24.split(':');
  let period = 'AM';

  let hours12 = parseInt(hours, 10);
  if (hours12 >= 12) {
    period = 'PM';
    if (hours12 > 12) {
      hours12 -= 12;
    }
  }



  const formattedTime = `${hours12}:${minutes} ${period}`;
  return formattedTime;
}

function formattedTime(selectedTime) {
  const formatted = convertTo12HourFormat(selectedTime);
  // Display the formatted time in your UI
  document.getElementById("formattedTimeDisplay").innerText = formatted;
  console.log("Formatted Time:", formatted);
}
function schedular(data, tag) {
  console.log("schedular function hitted", data);

  if (data === "false" && tag === "voice") {
    document.getElementById("messageBox").innerHTML += `<div class="first-chat">
      <p>You will be contacted shortly by one of our Customer Care Representatives via Voice Call on ${formData.customer_phone_number}</p>
      <div class="arrow"></div>
    </div>`;
  } else if (data === "false" && tag === "video") {
    document.getElementById("messageBox").innerHTML += `<div class="first-chat">
      <p>You will be provided with a link to join the video room via a message on ${formData.customer_phone_number}</p>
      <div class="arrow"></div>
    </div>`;
  } else if (data === "true") {
    document.getElementById("messageBox").innerHTML += `<div class="first-chat">
      <p>You will be contacted shortly by one of our Customer Care Representatives via Voice Call on ${formData.customer_phone_number}</p>
      <div class="arrow"></div>
    </div>`;
    document.getElementById("messageBox").innerHTML += `
      <div class="second-chat">
        <div class="date-time">
          <label for="scheduleDate">Select Date:</label>
          <input type="date" id="scheduleDate" name="scheduleDate">

          <label for="scheduleTime">Select Time:</label>
          <input type="time" id="scheduleTime" name="scheduleTime" step="60" onchange="formattedTime">

          <button onclick="scheduleVoiceCall()">Done</button>
        </div>
      </div>`;
  }
}