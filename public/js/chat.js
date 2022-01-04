const socket = io()

// Elements
const $messageForm = document.querySelector('#message-form')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $sendLocationButton = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')

// Templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationMessageTemplate = document.querySelector('#location-message-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

// Options
const {username, room} = Qs.parse(location.search, { ignoreQueryPrefix: true })

//Auto Scroll
const autoscroll = () => {
    // New message element
    const $newMessage = $messages.lastElementChild

    // Height of the new message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    // Visible Height
    const visibleHeight = $messages.offsetHeight
    
    // Height of messages container
    const containerHeight = $messages.scrollHeight

    // How far have I scrolled?
    const scrollOffset = $messages.scrollTop + visibleHeight

    if(containerHeight-newMessageHeight <= scrollOffset){
        $messages.scrollTop = $messages.scrollHeight
    }
}

//on login
socket.on('message', (message) => {
    console.log(message)
    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

//Render data about location in console
socket.on('locationMessage', (message) => {
    console.log(message)
    const html = Mustache.render(locationMessageTemplate, {
        username: message.username,
        url: message.url,
        createdAt: moment(message.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('roomData',({ room, users}) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML = html
})

//Submitting a new message
$messageForm.addEventListener('submit', (e) => {
    e.preventDefault()

    //temporarily disable send
    $messageFormButton.setAttribute('disabled', 'disabled')

    //inputed text
    const message = e.target.elements.message.value

    //call to send to server
    socket.emit('sendMessage', message, (error) => {
        //reenable send 
        $messageFormButton.removeAttribute('disabled')
        //clear text box
        $messageFormInput.value = ''
        //automatically select text box
        $messageFormInput.focus()

        //error callback
        if (error) {
            return console.log(error)
        }

        console.log('Message delivered!')
    })
})

//send location button
$sendLocationButton.addEventListener('click', () => {
    //checks to see if browser compatible
    if (!navigator.geolocation) {
        return alert('Geolocation is not supported by your browser.')
    }

    //temporarily disables send location
    $sendLocationButton.setAttribute('disabled', 'disabled')

    //grabs longitude and latitude
    navigator.geolocation.getCurrentPosition((position) => {
        //sends data to server
        socket.emit('sendLocation', {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        }, () => {
            //callback and reenable send location
            $sendLocationButton.removeAttribute('disabled')
            console.log('Location shared!')
            console.log()  
        })
    })
})

socket.emit('join', {username, room}, (error) => {
    if(error) {
        alert(error)
        location.href ='/'
    }
})
