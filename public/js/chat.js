const socket = io()
//elements
const $messageForm = document.querySelector('#message-form')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $sendLocationButton = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')

// Templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationTemplate = document.querySelector('#location-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

//Options 
const {username, room}= Qs.parse(location.search, { ignoreQueryPrefix: true })
const autoscroll = ()=>{
    // New message element
    const $newMessage = $messages.lastElementChild

    // height of the new message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    //Visible height 
    const visibleHeight = $messages.offsetHeight

    //Height of messages container
    const containerHeight = $messages.scrollHeight

    //how far have i scrolled
    const scrollOffset = $messages.scrollTop + visibleHeight

    if(containerHeight - newMessageHeight <= scrollOffset){
        $messages.scrollTop = $messages.scrollHeight
    }
}

socket.on('message',(message)=>{  //message should match in index.js
    console.log(message)
    const html = Mustache.render(messageTemplate,{
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend',html)
    autoscroll()
})

socket.on('locationMessage',(location)=>{
    console.log(location)
    const html = Mustache.render(locationTemplate,{
        username: location.username,
        location:location.url,
        createdAt: moment(location.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend',html)
    autoscroll()
})

socket.on('roomData',({room, users})=>{
    const html = Mustache.render(sidebarTemplate,{
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML = html
})

$messageForm.addEventListener('submit', (e)=>{
    e.preventDefault()
    $messageFormButton.setAttribute('disabled','disabled')
    //disable
    const msg = e.target.elements.message.value
    socket.emit('sendMessage', msg, (error)=>{
        $messageFormButton.removeAttribute('disabled')
        $messageFormInput.value = ''
        $messageFormInput.focus()
        //enable
        if(error){
            return console.log(error)
        }
        console.log('The mesage was delivered')
    })
})

$sendLocationButton.addEventListener('click',()=>{
    $sendLocationButton.setAttribute('disabled', 'disabled')
    if(!navigator.geolocation){       //if exits they have support else they dont 
        return alert('Geolocation is not supported by your browser.')
    }        
    navigator.geolocation.getCurrentPosition((position)=>{
         socket.emit('sendLocation', {
             latitude: position.coords.latitude,
             longitude: position.coords.longitude
         }, ()=>{
             $sendLocationButton.removeAttribute('disabled')
             console.log('Location sent')   //acknowlegement
         })
    })
})

socket.emit('join', {username, room},(error)=>{
   if(error){
       alert(error)
       location.href = '/'
   }
})