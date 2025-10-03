import { IEmailObject } from "../../../common/interface/subscription.interface";

export const SubscriptionMailContent = {
  nearExpired: (mailObj: IEmailObject) => `<!DOCTYPE HTML PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
  <html xmlns="http://www.w3.org/1999/xhtml">
  <head>
    <meta http-equiv="Content-Type" content="text/html;charset=utf-8" />
    <!-- <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no, minimum-scale=1.0, maximum-scale=1.0" /> -->
  </head>
  <body>
    <div class="inHeader inContent" style="background-color: #f3f3f3; font-family: 'Arial'; width: 99%; min-height: 45px; height: auto; margin-top: 10px; font-size: 14px; text-align: center;">
      <table cellpadding="0" cellspacing="0" border="0" width="90%" style="margin:20px auto; background-color: #ffffff; padding: 50px 2%; border-radius: 4px;">
        <tr>
          <td align="center" style="font-size:18px; color: #666666; padding-bottom: 30px;">
            <img src="${mailObj.logo_url}logo_flo.png" height="52px" width="83px"/>
          </td>
        </tr>
        <tr>
          <td align="left" style="font-size:16px; color: #444444; line-height: 20px; padding: 0 30px; ">
            <p>Dear User,</p>
            <p>We noticed that you have changed to the Premium/Free plan.
  Please make sure that by <b>${mailObj.expired}</b> that you have reduced your storage to 10/5 Gybtes and the number of your 3rd party accounts to 3/1.
  If you are over the storage or 3rd party account limit, your account will be temporarily disabled.
  You can check your storage and 3rd party account limits in the Flo app by going to <b>Settings > Subscriptions</b>.
  </p>
            <p>Regards,<br />Flo Online Team</p>
          </td>
        </tr>
      </table>
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top: 20px; margin-bottom: 30px; font-size: 13px;">
        <tr>
          <td width="33.3%" align="right">
            ${mailObj.flo_copyright}
          </td>
          <td width="33.3%" align="center">
            <a href="http://www.floware.com/terms-of-service" target="_blank" style="color: #666; text-decoration: none;">Terms of Service</a>
          </td>
          <td width="33.3%" align="left">
            <a href="http://www.floware.com/privacy-policy" target="_blank" style="color: #666; text-decoration: none;">Privacy Policy</a>
          </td>
        </tr>
      </table>
    </div>
  </body>
  </html>`,
  storageFull: (mailObj: IEmailObject)=>`<!DOCTYPE HTML PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
  <html xmlns="http://www.w3.org/1999/xhtml">
  <head>
    <meta http-equiv="Content-Type" content="text/html;charset=utf-8" />
    <!-- <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no, minimum-scale=1.0, maximum-scale=1.0" /> -->
  </head>
  <body>
    <div class="inHeader inContent" style="background-color: #f3f3f3; font-family: 'Arial'; width: 99%; min-height: 45px; height: auto; margin-top: 10px; font-size: 14px; text-align: center;">
      <table cellpadding="0" cellspacing="0" border="0" width="90%" style="margin:20px auto; background-color: #ffffff; padding: 50px 2%; border-radius: 4px;">
        <tr>
          <td align="center" style="font-size:18px; color: #666666; padding-bottom: 30px;">
            <img src="${mailObj.logo_url}logo_flo.png" height="52px" width="83px"/>
          </td>
        </tr>
        <tr>
          <td align="left" style="font-size:16px; color: #444444; line-height: 20px; padding: 0 30px; ">
            <p>Whoops. You have hit your storage limit for Flo. We're glad to see you like the app.
            You can sign up for more storage in <b>Settings > Subscriptions</b>.
            Until you increase your storage limit, you will not be able to save or receive emails on your Flo account (${mailObj.email}),
            create new Flo Events, ToDos, Contacts, or Notes, or add objects to Flo Collections.
            Alternatively you can conserve storage space by permanently deleting unneeded items such as emails with large attachments.</p>
            <p>Regards,<br />Flo Online Team</p>
          </td>
        </tr>
      </table>
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top: 20px; margin-bottom: 30px; font-size: 13px;">
        <tr>
          <td width="33.3%" align="right">
            ${mailObj.flo_copyright}
          </td>
          <td width="33.3%" align="center">
            <a href="http://www.floware.com/terms-of-service" target="_blank" style="color: #666; text-decoration: none;">Terms of Service</a>
          </td>
          <td width="33.3%" align="left">
            <a href="http://www.floware.com/privacy-policy" target="_blank" style="color: #666; text-decoration: none;">Privacy Policy</a>
          </td>
        </tr>
      </table>
    </div>
  </body>
  </html>`,
  storageNearFull: (mailObj: IEmailObject)=>`<!DOCTYPE HTML PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
  <html xmlns="http://www.w3.org/1999/xhtml">
  <head>
    <meta http-equiv="Content-Type" content="text/html;charset=utf-8" />
    <!-- <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no, minimum-scale=1.0, maximum-scale=1.0" /> -->
  </head>
  <body>
    <div class="inHeader inContent" style="background-color: #f3f3f3; font-family: 'Arial'; width: 99%; min-height: 45px; height: auto; margin-top: 10px; font-size: 14px; text-align: center;">
      <table cellpadding="0" cellspacing="0" border="0" width="90%" style="margin:20px auto; background-color: #ffffff; padding: 50px 2%; border-radius: 4px;">
        <tr>
          <td align="center" style="font-size:18px; color: #666666; padding-bottom: 30px;">
            <img src="${mailObj.logo_url}logo_flo.png" height="52px" width="83px"/>
          </td>
        </tr>
        <tr>
          <td align="left" style="font-size:16px; color: #444444; line-height: 20px; padding: 0 30px; ">
            <p>Thanks for using Flo. We've noticed that you're at ${mailObj.percent}% of your storage limit. If you'd like to increase your limit, you can sign up for more storage in <b>Settings > Subscriptions</b>.</p>
            <p>Regards,<br />Flo Online Team</p>
          </td>
        </tr>
      </table>
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top: 20px; margin-bottom: 30px; font-size: 13px;">
        <tr>
          <td width="33.3%" align="right">
            ${mailObj.flo_copyright}
          </td>
          <td width="33.3%" align="center">
            <a href="http://www.floware.com/terms-of-service" target="_blank" style="color: #666; text-decoration: none;">Terms of Service</a>
          </td>
          <td width="33.3%" align="left">
            <a href="http://www.floware.com/privacy-policy" target="_blank" style="color: #666; text-decoration: none;">Privacy Policy</a>
          </td>
        </tr>
      </table>
    </div>
  </body>
  </html>`,
  thankUpgraded: (mailObj: IEmailObject)=>`<!DOCTYPE HTML PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
  <html xmlns="http://www.w3.org/1999/xhtml">
  <head>
    <meta http-equiv="Content-Type" content="text/html;charset=utf-8" />
    <!-- <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no, minimum-scale=1.0, maximum-scale=1.0" /> -->
  </head>
  <body>
    <div class="inHeader inContent" style="background-color: #f3f3f3; font-family: 'Arial'; width: 99%; min-height: 45px; height: auto; margin-top: 10px; font-size: 14px; text-align: center;">
      <table cellpadding="0" cellspacing="0" border="0" width="90%" style="margin:20px auto; background-color: #ffffff; padding: 50px 2%; border-radius: 4px;">
        <tr>
          <td align="center" style="font-size:18px; color: #666666; padding-bottom: 30px;">
            <img src="${mailObj.logo_url}logo_flo.png" height="52px" width="83px"/>
          </td>
        </tr>
        <tr>
          <td align="left" style="font-size:16px; color: #444444; line-height: 20px; padding: 0 30px; ">
            <p>Thank you very much. You have successfully upgraded your account to a ${mailObj.expired} Subscription.</p>
            <p>Regards,<br />Flo Online Team</p>
          </td>
        </tr>
      </table>
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top: 20px; margin-bottom: 30px; font-size: 13px;">
        <tr>
          <td width="33.3%" align="right">
            ${mailObj.flo_copyright}
          </td>
          <td width="33.3%" align="center">
            <a href="http://www.floware.com/terms-of-service" target="_blank" style="color: #666; text-decoration: none;">Terms of Service</a>
          </td>
          <td width="33.3%" align="left">
            <a href="http://www.floware.com/privacy-policy" target="_blank" style="color: #666; text-decoration: none;">Privacy Policy</a>
          </td>
        </tr>
      </table>
    </div>
  </body>
  </html>`,
};
