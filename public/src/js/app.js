// Check if browser supports Promises, if it doesn't add the polyfill for it
if (!window.Promise) {
    window.Promise = Promise
}

let deferredPrompt = null

// Check if browser supports service workers
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
        .then(() => {
            console.log('Service worker registered!')
        }).catch((error) => {
            console.log(error)
        })
}

window.addEventListener('beforeinstallprompt', (event) => {
    // Prevent chrome from showing the banner
    console.log('beforeinstallprompt fired')
    event.preventDefault()
    deferredPrompt = event
    return false
})

// This promise takes in a function (named or anonymous) which takes in two 
// additional functions that indicate a resolve() or reject()
// const promise = new Promise((resolve, reject) => {
//     setTimeout(() => {
//         // resolve('This is executed once the timer is done')
//         reject({ code: 500, message: 'An error occured!' })
//     }, 3000)
// })

// Fetch get example
// .json() is an async function that converts the response stream into json data
// fetch('https://nghttp2.org/httpbin/ip')
//     .then(response => {
//         console.log(response)
//         return response.json()
//     })
//     .then(data => {
//         console.log(data)
//     })
//     .catch(error => {
//         console.log(error)
//     })

// Fetch post example
// Setting the 'Accept' header may not be necessary; it depends on the API
// endpoint
// @mode is defaulted to 'cors'
// fetch('https://nghttp2.org/httpbin/post', {
//     method: 'POST',
//     headers: {
//         'Content-Type': 'application/json',
//         'Accept': 'application/json'
//     },
//     mode: 'cors',
//     body: JSON.stringify({ message: 'Does this work?' })
// }).then(response => {
//     console.log(response)
//     return response.json()
// }).then(data => {
//     console.log(data)
// }).catch(error => {
//     console.log(error)
// })

// Below is an XMLHttpRequest (AJAX Request) that performs a GET request
// This is not suitable for service workers, since this uses synchronous code;
// we need asynchronous execution like in the Fetch API
// const xhr = new XMLHttpRequest()
// xhr.open('GET', 'https://nghttp2.org/httpbin/ip')
// xhr.responseType = 'json'
// xhr.onload = () => {
//     console.log(xhr.response)
// }
// xhr.onerror = () => {
//     console.log('Error!')
// }
// xhr.send()

// The function inside then() is fired whenever resolve() or reject() is called
// The function recieves the value that is passed to resolve() or reject()
// promise.then((text) => {
//     return text
// }, (error) => {
//     console.log(error.code, error.message)
// }).then((newText) => {
//     console.log(newText)
// })

// Below is a cleaner, more readable version of the above
// catch() will catch any errors above where it is called
// If a catch() is at the bottom, we are handling any errors of the promise 
// chain
// promise.then((text) => {
//     return text
// }).then((newText) => {
//     console.log(newText)
// }).catch((error) => {
//     console.log(error.code, error.message)
// })

// Example below shows how async code is executed and is non-blocking
// setTimeout(() => {
//     console.log('This is executed once the timer is done')
// }, 3000)

// console.log('This is executed right after setTimeout()')
