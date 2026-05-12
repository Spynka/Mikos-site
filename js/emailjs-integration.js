/**
 * Единый файл EmailJS для театра клоунады «Микос».
 * Только генераторы и экспорты — вызов идёт из инлайн-скриптов страниц.
 */
(function () {
  'use strict';
  const PUBLIC_KEY = 'R0-quhRSUYh1lfwph';
  const SERVICE_ID = 'service_qikzy8g';
  const TEMPLATE_ID = 'template_qxu6jwv';

  emailjs.init(PUBLIC_KEY);

  function showNotification(message, type) {
    console.log(`EmailJS [${type}]: ${message}`);
  }

  // ===== ОБЩАЯ ФУНКЦИЯ ОТПРАВКИ =====
  // toEmail – адрес, куда уйдёт письмо (должен быть {{to_email}} в шаблоне)
  async function sendEmailHtml(subject, html, toEmail) {
    console.log('>>> Попытка отправки:', subject, '→', toEmail);
    try {
      const result = await emailjs.send(SERVICE_ID, TEMPLATE_ID, {
        subject: subject,
        email_html: html,
        to_email: toEmail
      });
      console.log('>>> Успешно отправлено, статус:', result.status, result.text);
      showNotification(subject + ' — успешно отправлено', 'success');
      return true;
    } catch (error) {
      console.error('>>> ОШИБКА EmailJS:', error);
      alert('Ошибка отправки письма: ' + (error.message || error));
      showNotification('Ошибка при отправке. Попробуйте позже.', 'error');
      return false;
    }
  }

  // ========== HTML-ГЕНЕРАТОРЫ ПИСЕМ ==========

  function wrapEmail(title, subtitle, greetingHtml, detailsHtml, contactsHtml, footer) {
    return `<!DOCTYPE html>
<html lang="ru">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<style>
body,table,td,p{font-family:'Nunito Sans',Arial,sans-serif}h2,h3{font-family:'Unbounded',Arial,sans-serif}
@media only screen and (max-width:480px){
.container{padding:20px 10px!important}.card{padding:20px!important;border-radius:8px!important}
.logo{font-size:22px!important}.title{font-size:18px!important}.greeting{font-size:14px!important}
.details td{padding:8px 0!important}.label{width:90px!important;font-size:12px!important}
.value{font-size:13px!important}.contact-block{padding:12px!important;font-size:13px!important}
.footer{font-size:11px!important}}
</style></head>
<body style="margin:0;padding:0;background:#F8F7F6;">
<table width="100%" cellpadding="0" cellspacing="0" bgcolor="#F8F7F6" class="container">
<tr><td align="center" style="padding:40px 20px;" class="container">
<table width="100%" cellpadding="0" cellspacing="0" bgcolor="#ffffff" style="max-width:600px;border-radius:12px;border:1px solid #E5E3E1;" class="card">
<tr><td style="padding:40px;" class="card">

<div style="font-family:'Unbounded',Arial,sans-serif;font-size:26px;font-weight:bold;color:#2A3D5E;margin-bottom:10px;" class="logo">Театр клоунады «Микос»</div>
<div style="font-size:14px;color:#5A5556;margin-bottom:30px;">${subtitle}</div>

<table cellpadding="0" cellspacing="0" style="margin-bottom:30px;"><tr>
<td style="border-left:4px solid #E8454D;padding-left:16px;">
<h2 style="margin:0;color:#1A1718;font-size:20px;font-weight:600;" class="title">${title}</h2>
</td></tr></table>

<div style="font-size:16px;color:#1A1718;margin-bottom:20px;" class="greeting">${greetingHtml}</div>

${detailsHtml}

${contactsHtml ? `<div style="background:#F8F7F6;border-radius:8px;padding:20px;margin-bottom:30px;" class="contact-block">${contactsHtml}</div>` : ''}

<p style="margin-top:20px;padding-top:20px;border-top:1px solid #E5E3E1;color:#5A5556;font-size:12px;" class="footer">${footer || 'С уважением, команда «Микос»'}</p>

</td></tr></table></td></tr></table></body></html>`;
  }

  function buildDetailsTable(rows) {
    let html = '<table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:30px;" class="details">';
    html += '<tr><td colspan="2" style="padding-bottom:12px;font-family:\'Unbounded\',Arial,sans-serif;font-size:16px;color:#2A3D5E;font-weight:600;">' + (rows.caption || '') + '</td></tr>';
    rows.items.forEach(row => {
      html += `<tr><td style="padding:10px 0;border-bottom:1px solid #E5E3E1;color:#5A5556;width:120px;" class="label">${row.label}</td><td style="padding:10px 0;border-bottom:1px solid #E5E3E1;color:#1A1718;font-weight:600;" class="value">${row.value || ''}</td></tr>`;
    });
    html += '</table>';
    return html;
  }

  // ---------- 1. Заявка (index.html) ----------
  function buildClientRequestEmail(params) {
    const greeting = `Здравствуйте, <strong>${params.name}</strong>!<br>Мы получили вашу заявку на сотрудничество. Менеджер театра свяжется с вами <strong>в течение 2 часов</strong> (в рабочие дни, Пн–Пт 11:00–19:00).`;
    const details = buildDetailsTable({
      caption: 'Детали заявки',
      items: [
        { label: 'Имя', value: params.name },
        { label: 'Компания', value: params.company },
        { label: 'Email', value: params.email },
        { label: 'Сообщение', value: params.message?.replace(/\n/g, '<br>') }
      ]
    });
    const contacts = '<p style="margin:0 0 8px;font-weight:600;color:#1A1718;">Если возникнут вопросы:</p><p style="margin:0;font-size:14px;color:#3D393A;"><a href="mailto:partner@teatr-sreda.ru" style="color:#4A6294;text-decoration:none;">partner@teatr-sreda.ru</a> &nbsp;|&nbsp; <a href="tel:+74951234567" style="color:#4A6294;text-decoration:none;">+7 (495) 123-45-67</a></p>';
    return wrapEmail('Заявка принята', 'Спасибо, что выбираете нас!', greeting, details, contacts, 'С уважением и клоунским обаянием, команда «Микос»');
  }

  // ---------- 2. Конструктор запроса (for-customers.html) ----------
  function buildRequestBuilderEmail(params) {
    const greeting = `Здравствуйте, <strong>${params.name}</strong>!<br>Мы внимательно изучим ваш запрос и отправим предложение в ближайшее время (обычно в течение 2–3 часов в рабочие дни).`;

    const typeLabels = {
        corporate: 'Корпоративный показ',
        private: 'Частное событие',
        education: 'Образовательный проект'
    };
    const formatLabels = {
        ready: 'Готовый спектакль',
        custom: 'Индивидуальная постановка',
        workshop: 'Мастер-класс'
    };

    const details = buildDetailsTable({
        caption: 'Параметры запроса',
        items: [
            { label: 'Имя', value: params.name },
            { label: 'Компания', value: params.company },
            { label: 'Email', value: params.email },
            { label: 'Телефон', value: params.phone },
            { label: 'Тип мероприятия', value: typeLabels[params.event_type] || params.event_type },
            { label: 'Дата', value: params.event_date },
            { label: 'Зрителей', value: params.audience },
            { label: 'Формат', value: formatLabels[params.format] || params.format },
            { label: 'Пожелания', value: params.wishes?.replace(/\n/g, '<br>') }
        ]
    });

    const contacts = '<p style="margin:0 0 8px;font-weight:600;color:#1A1718;">Контакты для связи:</p><p style="margin:0;font-size:14px;color:#3D393A;"><a href="mailto:partner@teatr-sreda.ru" style="color:#4A6294;text-decoration:none;">partner@teatr-sreda.ru</a> &nbsp;|&nbsp; <a href="tel:+74951234567" style="color:#4A6294;text-decoration:none;">+7 (495) 123-45-67</a></p>';
    return wrapEmail('Запрос сформирован', 'Ваш персональный запрос принят', greeting, details, contacts, 'С клоунским приветом, команда «Микос»');
  }

  // ---------- 3. Обратная связь (for-customers/contacts) ----------
  function buildContactEmail(params) {
    const greeting = `Здравствуйте, <strong>${params.name}</strong>!<br>Мы получили ваше сообщение и ответим <strong>в течение 24 часов</strong> в рабочие дни.`;
    const items = [
      { label: 'Имя', value: params.name },
      { label: 'Email', value: params.email }
    ];
    if (params.company) items.push({ label: 'Компания', value: params.company });
    if (params.phone) items.push({ label: 'Телефон', value: params.phone });
    if (params.subject) items.push({ label: 'Тема', value: params.subject });
    items.push({ label: 'Сообщение', value: params.message?.replace(/\n/g, '<br>') });

    const details = buildDetailsTable({ caption: 'Ваше обращение', items });
    const contacts = '<p style="margin:0 0 8px;font-weight:600;color:#1A1718;">Наши контакты</p><p style="margin:0;font-size:14px;color:#3D393A;"><a href="mailto:info@mikos-teatr.ru" style="color:#4A6294;text-decoration:none;">info@mikos-teatr.ru</a> &nbsp;|&nbsp; <a href="tel:+74951234567" style="color:#4A6294;text-decoration:none;">+7 (495) 123-45-67</a></p>';
    return wrapEmail('Спасибо за обратную связь', 'Ваше сообщение получено', greeting, details, contacts, 'Всегда вам рады, команда «Микос»');
  }

  // ---------- 4. Заказ мерча (shop.html) ----------
  function buildOrderMerchEmail(params) {
    const greeting = `Здравствуйте, <strong>${params.name}</strong>!<br>Мы начали сборку вашего заказа. Информацию о доставке и способе связи мы приняли — менеджер уточнит детали при необходимости.`;
    const details = buildDetailsTable({
      caption: 'Данные покупателя',
      items: [
        { label: 'Имя', value: params.name },
        { label: 'Телефон', value: params.phone },
        { label: 'Email', value: params.email },
        { label: 'Способ связи', value: params.contact_method }
      ]
    });
    const orderBlock = `<div style="margin-top:30px;background:#F8F7F6;border-radius:8px;padding:20px;" class="order-summary"><h3 style="font-family:'Unbounded',Arial,sans-serif;font-size:16px;color:#2A3D5E;margin:0 0 15px;">Состав заказа</h3>${params.order_summary || ''}</div>`;
    return wrapEmail('Заказ на мерч', 'Ваш заказ оформлен', greeting, details + orderBlock, null, 'Чек будет отправлен отдельным письмом. Спасибо, что украшаете мир «Микосом»!');
  }

  // ---------- 5. Билеты (checkout.html) ----------
  function buildTicketEmail(params) {
    const greeting = `Здравствуйте, <strong>${params.buyer_name}</strong>!<br>Ваш заказ оплачен, билеты готовы и находятся в этом письме.`;
    const details = buildDetailsTable({
      caption: 'Информация о заказе',
      items: [
        { label: 'Заказ №', value: params.order_number },
        { label: 'Спектакль', value: params.performance },
        { label: 'Дата и время', value: params.datetime },
        { label: 'Зал', value: params.hall },
        { label: 'Покупатель', value: params.buyer_name },
        { label: 'Email', value: params.buyer_email }
      ]
    });
    const ticketsBlock = `<div style="margin-top:30px;background:#F8F7F6;border-radius:8px;padding:20px;" class="tickets-block"><h3 style="font-family:'Unbounded',Arial,sans-serif;font-size:16px;color:#2A3D5E;margin:0 0 15px;">Список билетов</h3>${params.tickets_list || ''}</div>`;
    const totalBlock = `<table cellpadding="0" cellspacing="0" width="100%" style="margin-top:20px;"><tr><td style="padding:15px 0;border-top:2px solid #2A3D5E;font-family:'Unbounded',Arial,sans-serif;font-size:18px;font-weight:bold;color:#1A1718;" class="total">Всего оплачено: ${params.total_price}</td></tr></table>`;
    return wrapEmail('Билеты к спектаклю', 'Ваши билеты', greeting, details + ticketsBlock + totalBlock, null, 'Билеты можно показать на экране телефона. Распечатывать необязательно.');
  }

  // ========== ЭКСПОРТЫ ДЛЯ ВЫЗОВА ИЗ ИНЛАЙН-СКРИПТОВ ==========

  // index.html – форма "Отправить заявку"
  window.sendClientRequest = async function (params) {
    const html = buildClientRequestEmail(params);
    return await sendEmailHtml('Заявка принята — театр «Микос»', html, params.email);
  };

  // for-customers.html – конструктор запроса
  window.sendRequestBuilder = async function (params) {
    const html = buildRequestBuilderEmail(params);
    return await sendEmailHtml('Запрос сформирован — театр «Микос»', html, params.email);
  };

  // for-customers.html / contacts.html – форма обратной связи
  window.sendContactForm = async function (params) {
    const html = buildContactEmail(params);
    return await sendEmailHtml('Спасибо за обратную связь — театр «Микос»', html, params.email);
  };

  // shop.html – оформление заказа
  window.sendOrderMerch = async function (params) {
    const html = buildOrderMerchEmail(params);
    return await sendEmailHtml('Заказ оформлен — театр «Микос»', html, params.email);
  };

// checkout.html – отправка билетов
window.sendTicketEmail = async function (data) {
    // Принимаем оба варианта имени параметра: и buyerEmail, и buyer_email
    const buyerEmail = data.buyerEmail || data.buyer_email;
    
    if (!data || !buyerEmail) {
        console.error('sendTicketEmail: нет данных или email');
        console.log('Полученные данные:', data);
        return false;
    }
    
    const params = {
        ...data,
        buyer_email: buyerEmail, 
        buyerEmail: buyerEmail   
    };
    
    const html = buildTicketEmail(params);
    return await sendEmailHtml('Ваши билеты — театр «Микос»', html, buyerEmail);
};

})();