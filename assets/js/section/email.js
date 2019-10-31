let status = settings.get('status')
if (status === 'login') {

    getMail()

}

$(function () {
    $(document).on('click', '.list-emallDiv', function () {
        let uid = $(this).attr('uid')
        console.log('list uid', uid)
        $('#inbox-emall footer').hide()
        $('.email-uid').hide()
        $('.email-uid').each(function () {
            let id = $(this).attr('uid')
            if (id == uid) {
                $(this).show()
                $('#inbox-emall footer').show().attr('uid', uid)
            }
        })


    })
})