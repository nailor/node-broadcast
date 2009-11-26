(function() {
     function append_messages(msgs) {
         for (var i=0; i<msgs.length; i++) {
             var msg = msgs[i];
             $('#messages').append(
                 $('<li>').text(msg.message)
             );
         }
         // Return the id of the last message, increased by one
         return msgs[msgs.length-1].id + 1;
     }

     function poll_messages() {
         var statediv = $('#chat-state');
         if (statediv.data('running') === true) {
             return;
         } else {
             statediv.data('running', true);
         }
         var id = statediv.data('id');
         if (!id) id = 0;
         $.getJSON(
             '/wait',
             {'id': id},
             function(data, status) {
                 statediv.data('running', false);
                 var last_id = append_messages(data);
                 statediv.data('id', last_id);
             }
         );
     }

     $(document).ready(
         function() {
             poll_messages();
             var interval = setInterval(
                 function() {
                     poll_messages();
                 }, 5000);
         });
 })();
