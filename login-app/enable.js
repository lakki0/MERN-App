const axios = require("axios");
const AzureClientCredentials = require("azure-client-credentials");
require("dotenv").config();
const nodemailer = require("nodemailer");

module.exports = async function (context, myTimer) {
  const credentials = new AzureClientCredentials(
    process.env.TENANT,
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET
  );

  const startTime = new Date();
  const getToken = async () => {
    const token = await credentials.getAccessToken(process.env.RESOURCE);
    return token;
  }


  const init = async () => {
    try {
      const token = await getToken();
      const subscriptions = await getSubscriptions(token);
      let enableSub = await subscriptions.filter((i) => {
        return i.state === "Enabled";
      });
      const enableSubIds = await enableSub.map((i) => {
        return { subId: i.subscriptionId, subName: i.displayName };
      });

      context.log(`Found ${enableSubIds.length} Enable subs: `, enableSubIds.map((sub) => sub.subName).join(", "));
      await handleSubs(enableSubIds);
    } catch (err) {
      context.log("Error in fetching subscriptions: ", err);
    }
  };



  const getSubscriptions = async (token) => {
    const result = await axios.get(
      `${process.env.BASE_URL}?api-version=2020-01-01`,
      {
        headers: {
          Authorization: "Bearer " + token,
        },
      }
    );
    const subscription = result.data.value;
    return subscription;
  }


  const handleSubs = async (enableSubIds) => {
    const token = await credentials.getAccessToken(process.env.RESOURCE);

    for (const sub of enableSubIds) {
      try {
        context.log(`-------------------Started ${sub.subName} subscription-------------------`);
        if (sub.subId === process.env.CURRENT_SUBSCRIPTION) {
          context.log(`Skipping ${sub.subName} subscription..`)
          continue;
        }
        const resourceGroups = await getResourceGroups(sub.subId, token);
        await handleResourceGroups(resourceGroups, sub, token);
      } catch (e) {
        context.log("Error occurred  for subscription: ", sub.subId, e)
      }

    }

    const endDate = new Date();
    context.log("Script completed..", endDate);
    context.log(`Script took: ${(endDate - startTime) / 1000}s`)


  };

  const getResourceGroups = async (enableSubId, token) => {
    const result = await axios.get(
      `${process.env.BASE_URL}/${enableSubId}/resourcegroups?api-version=2021-04-01`,
      {
        headers: {
          Authorization: "Bearer " + token,
        },
      }
    );
    const resourceGroups = result.data.value;
    return resourceGroups;
  };

  const handleResourceGroups = async (resourceGroups, sub, token) => {
    context.log(`Found ${resourceGroups.length} resource groups in ${sub.subName} subscription..`)
    for (const i of resourceGroups) {
      if (
        isTagExpired(i.tags)
      ) {
        if (
          sub.subId !== process.env.CURRENT_SUBSCRIPTION ||
          i.name !== process.env.CURRENT_RG
        ) {
          const res = await deleteResourceGroup(sub.subId, i.name, token);
        }
      } else {
        await updateTag(sub, i.name, i.tags, token);
      }
    };

    context.log(`-------------------Completed ${sub.subName} subscription-------------------`);
    context.log("\n");
  }




  const updateTag = async (sub, rgName, tags, token) => {
    try {
      context.log(`==> Updating ${rgName} tag in ${sub.subName} subscription to ..`)
      const newExp = +tags.Exp - 1;
      const res = await axios.patch(
        `${process.env.BASE_URL}/${sub.subId}/resourceGroups/${rgName}/providers/Microsoft.Resources/tags/default?api-version=2021-04-01`,
        {
          operation: "Merge",
          properties: { tags: { Exp: newExp } },
        },
        {
          headers: {
            Authorization: "Bearer " + token,
          },
        }
      );
      if (newExp == 3 && tags?.creatorEmail) {//send email to creator if expiration is 3 days away
        context.log("sending email to ", tags.creatorEmail)
        await sendEmail(tags.creatorEmail, rgName, sub, newExp);
      }

      context.log(`Updated ${rgName} tag in ${sub.subName} subscription status: `, res.status)
    } catch (e) {
      context.log(`Error occurred in updating ${rgName} tag in ${sub.subName} subscription: `, e)
    }
  }

  const isTagExpired = (tag) => {
    if (
      !tag ||
      !tag?.Exp ||
      Number.isNaN(+tag?.Exp) ||
      +tag?.Exp === 0 ||
      +tag?.Exp > 7
    ) {
      return true;
    }
    return false;
  }


  const deleteResourceGroup = async (subId, rgName, token) => {
    try {
      context.log(`==> Deleting ${rgName} from ${subId} subscription..`)

      const res = await axios.delete(
        `${process.env.BASE_URL}/${subId}/resourcegroups/${rgName}?forceDeletionTypes=Microsoft.Compute/virtualMachines,Microsoft.Compute/virtualMachineScaleSets&api-version=2021-04-01`,
        {
          headers: {
            Authorization: "Bearer " + token,
          },
        }
      );

      context.log(`Deleted ${rgName} from ${subId} subscription status: `, res.status)
      context.log("\n");

    } catch (e) {
      context.log(`Error occurred in deleting ${rgName} from ${subId} subscription: `, e);
    }
  };

  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));


  const sendEmail = async (email, rgName, sub, exp) => {
    try {
      const transporter = nodemailer.createTransport({
        host: "smtp-mail.outlook.com", // hostname
        secureConnection: false, // TLS requires secureConnection to be false
        port: 587, // port for secure SMTP
        tls: {
          ciphers: "SSLv3",
        },
        auth: {
          user: process.env.USER_EMAIL,
          pass: process.env.APP_PASSWORD,
        },
      });
      const mainText = exp > 0 ? ('in ' + exp + ' days') : ' tommorow';
      // setup e-mail data, even with unicode symbols
      const mailOptions = {
        from: process.env.USER_EMAIL, // sender address (who sends)
        to: email, // list of receivers (who receives)
        priority: "high",
        subject: `Alert! Deleting RG ${rgName}`, // Subject line
        text: `Your Resource Group - ${rgName} from ${sub.subName} will get deleted ${mainText}. Please update the "Exp" tag if ${rgName} is still required.`, // plaintext body
        html: `
        <style>
        table, th, td {
          border:1px solid;
        }
        td {
          text-align: center;
        }
        .name{
          text-transform: capitalize;
        }
        </style>
        <body>
        <p class='name'>Hi ${email.split(".")[0]},<br>
        Your Resource Group - ${rgName} from ${sub.subName
          } will get deleted ${mainText}. Please update the "Exp" tag if ${rgName
          } is still required.</p>
        <table style="width:100%">
            <tr>
              <th>Subscription Id</th>
              <th>Subscription Name</th>
              <th>Resource Group</th>
            </tr>
            <tr>
              <td>${sub.subId}</td>
              <td>${sub.subName}</td>
              <td>${rgName}</td>  
            </tr>
        </table>
        <p>Regards,<br>
        RG-Manager Team</p>
        
        <br><br>
        <b style="font-size:10px">NOTE: Do not reply, This is an AUTO GENERATED Email</b>
        </body>`, // html body
      };

      // send mail with defined transport object
      transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
          return context.log(error);
        }
      });
    } catch (e) {
      context.log(`Error in sending email to ${email}: `, e);
    }
  }

  await init();
};