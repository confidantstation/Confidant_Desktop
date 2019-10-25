const links = document.querySelectorAll('link[rel="import"]')

// Import and add each page to the DOM
Array.prototype.forEach.call(links, (link) => {
   console.log('link',link)
   console.log('link.import',link.import)
  if(!link.import){
    return false;
  }
  let template = link.import.querySelector('.task-template')
  let clone = document.importNode(template.content, true)
  if (link.href.match('about.html')) {
    document.querySelector('body').appendChild(clone)
  } else {
    document.querySelector('.content').appendChild(clone)
  }
})
