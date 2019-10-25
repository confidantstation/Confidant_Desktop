       let status = settings.get('status')
       if (status === 'login') {
           // getMail()

           let imap = new mailos()
           imap.getlist()
          
           console.log('list', list)
        
       }