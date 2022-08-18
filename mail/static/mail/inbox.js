window.addEventListener('DOMContentLoaded', function () {
  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', () => { compose_email(null) });

  load_mailbox('inbox');
});

function compose_email(mail) {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  if (!mail) {
    // Clear out composition fields
    document.querySelector('#compose-recipients').value = '';
    document.querySelector('#compose-subject').value = '';
    document.querySelector('#compose-body').value = '';
  }
  else {
    document.querySelector('#compose-recipients').value = mail.sender;
    document.querySelector('#compose-subject').value = mail.subject;
    document.querySelector('#compose-body').value = `On ${mail.timestamp} ${mail.sender} wrote: ${mail.body}`;
  }

  document.querySelector('#compose-form').onsubmit = function () {
    fetch('/emails', {
      method: 'POST',
      body: JSON.stringify({
        recipients: document.querySelector('#compose-recipients').value,
        subject: document.querySelector('#compose-subject').value,
        body: document.querySelector('#compose-body').value
      })
    })
      .then((response) => {
        load_mailbox('sent');
      })
  };
}

function load_mailbox(mailbox) {
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#email-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  // Request mailbox (Sent, Archive or Inbox) from the mail API
  fetch('emails/' + mailbox)
    .then(response => response.json())
    .then(emails => {
      document.querySelector('#emails-view').replaceChildren()
      document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;
      document.querySelector('#emails-view').append(render_mailbox(mailbox, emails));
      let mail_list = document.querySelectorAll('#read-mail');

      mail_list.forEach(element => {
        element.addEventListener('click', () => {
          mark_as_read(element.dataset.id);
          render_mail(mailbox, element.dataset.id);
        })
      }
      );
    })
}

function render_mailbox(box, mails) {
  //Create the Ordered list for representing the mails
  let order_list = document.createElement('ol');
  order_list.classList.add('list-group');
  order_list.classList.add('list-group');
  //Loop through each mail
  mails.forEach(email => {
    let list_item = document.createElement('li');
    let mail_div = document.createElement('div');
    let heading_div = document.createElement('div');
    let date_tag = document.createElement('span');
    let button = document.createElement('button');

    button.classList.add('btn');

    list_item.classList.add('list-group-item');
    list_item.classList.add('d-flex');
    list_item.classList.add('justify-content-between');
    list_item.classList.add('align-items-start');

    mail_div.classList.add('ms-2');
    mail_div.classList.add('me-auto');

    heading_div.classList.add('fw-bold');

    date_tag.classList.add('badge');
    date_tag.classList.add('bg-dark');
    date_tag.classList.add('rounded-pill');

    date_tag.innerHTML = email.timestamp;
    if (box === 'sent') {
      heading_div.innerHTML += email.recipients.join(', ');
    }
    else {
      heading_div.innerHTML += email.sender;
    }

    mail_div.append(heading_div);
    mail_div.innerHTML += email.subject;
    list_item.append(mail_div);
    list_item.append(date_tag);
    if (email.read === true && box !== 'sent') {
      list_item.style.backgroundColor = 'gray';
    }
    else {
      list_item.style.backgroundColor = 'white';
    }
    button.setAttribute('data-id', email.id);
    button.setAttribute('id', 'read-mail');
    button.append(list_item);

    order_list.append(button);
  });
  return order_list;
}

function render_mail(box, id) {
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';

  fetch('/emails/' + id)
    .then(response => response.json())
    .then(email => {
      let email_container = document.createElement('div');
      email_container.classList.add('container');

      let email_sender = document.createElement('div');
      email_sender.classList.add('col');
      email_sender.innerHTML = `<strong>From: </strong>${email.sender}`;

      let email_receiver = document.createElement('div');
      email_receiver.classList.add('col');
      email_receiver.innerHTML = `<strong>To: </strong>${email.recipients.join(',')}`;

      let email_subject = document.createElement('div');
      email_subject.classList.add('col');
      email_subject.innerHTML = `<strong>Subject: </strong>${email.subject}`;

      let email_body = document.createElement('div');
      email_body.classList.add('col');
      email_body.innerHTML = `${email.body}`;
      let ruler = document.createElement('hr')
      let email_time = document.createElement('div');
      email_time.classList.add('col');
      email_time.innerHTML = `<strong>Timestamp:</strong> ${email.timestamp}`;

      let reply_btn = document.createElement('button');
      let archive_btn = document.createElement('button');
      let reply_div = document.createElement('div');
      reply_div.classList.add('col');

      reply_btn.classList.add('btn');
      reply_btn.classList.add('btn-sm');
      reply_btn.classList.add('btn-outline-primary');

      archive_btn.classList.add('btn');
      archive_btn.classList.add('btn-sm');
      if (email.archived === true) {
        archive_btn.classList.add('btn-primary');
      }
      else {
        archive_btn.classList.add('btn-outline-primary');
      }

      reply_btn.classList.add('ms-2');
      archive_btn.classList.add('ms-2');
      reply_btn.setAttribute('id', 'reply');
      archive_btn.setAttribute('id', 'archive')
      reply_btn.innerHTML = `Reply`;
      archive_btn.innerHTML = `Archive`;

      reply_div.append(reply_btn)
      reply_div.append(archive_btn)

      email_container.append(email_sender);
      email_container.append(email_receiver);
      email_container.append(email_subject);
      email_container.append(email_time);
      email_container.append(reply_div);
      email_container.append(ruler)
      email_container.append(email_body);
      document.querySelector('#email-view').replaceChildren();
      document.querySelector('#email-view').append(email_container);
      document.getElementById('reply').addEventListener('click', () => {
        if (box !== 'sent') {
          compose_email(email);
        }
      });
      document.getElementById('archive').addEventListener('click', () => archive_mail(id, email.archived));
    });
}

function mark_as_read(email_id) {
  fetch(`/emails/${email_id}`, {
    method: 'PUT',
    body: JSON.stringify({
      read: true
    })
  })
}

function archive_mail(email_id, archive_status) {
  if (archive_status === true) {
    archive_status = false;
  }
  else {
    archive_status = true;
  }

  fetch(`/emails/${email_id}`, {
    method: 'PUT',
    body: JSON.stringify({
      archived: archive_status
    })
  }).then((response) => { load_mailbox('inbox') })
}