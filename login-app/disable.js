require("dotenv").config();
const axios = require("axios");
const AzureClientCredentials = require("azure-client-credentials");
const DELETE_DELAY = 1000;//in ms

module.exports = async function (context, myTimer) {
  const credentials = new AzureClientCredentials(
    process.env.TENANT,
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET
  );
  const startTime = new Date();

  const init = async () => {
    context.log("Script started..", startTime);
    try {
      const token = await credentials.getAccessToken(process.env.RESOURCE);
      const subscriptions = await getSubscriptions(token);
      context.log("Subscriptions", subscriptions);
      let disableSub = subscriptions.filter((i) => {
        return i.state !== "Enabled";
      });
      const disableSubId = await disableSub.map((i) => {
        return { subId: i.subscriptionId, subName: i.displayName };
      });

      context.log(`Found ${disableSubId.length} disabled subscriptions..`)

      await handleSubs(disableSubId);
    } catch (err) {
      context.log("`Error occurred in fetching subscriptions: ", err);
    }
  }

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



  const handleSubs = async (disableSubId) => {
    const token = await credentials.getAccessToken(process.env.RESOURCE);

    for (const sub of disableSubId) {
      try {
        context.log(`-------------------Started ${sub.subName} subscription-------------------`);
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

  const getResourceGroups = async (subId, token) => {
    const result = await axios.get(
      `${process.env.BASE_URL}/${subId}/resourcegroups?api-version=2021-04-01`,
      {
        headers: {
          Authorization: "Bearer " + token,
        },
      }
    );

    const resourceGroups = result.data.value;
    return resourceGroups;
  }


  const handleResourceGroups = async (resourceGroups, sub, token) => {
    context.log(`Found ${resourceGroups.length} resource groups in ${sub.subName} subscription..`)
    for (const resource of resourceGroups) {
      if (
        shouldDeleteSub(sub.subId, resource.name)
      ) {
        await deleteResourceGroup(sub.subId, resource.name, token);
        await delay(DELETE_DELAY)

      }
    }

    context.log(`-------------------Completed ${sub.subName} subscription-------------------`);
    context.log("\n");
  }


  const shouldDeleteSub = (subId, rgName) => {
    const exluded = (process.env.EXCLUDED || '').split(",");
    if (subId === process.env.CURRENT_SUBSCRIPTION || rgName === process.env.CURRENT_RG || exluded.includes(rgName)) {
      context.log(`Skipping ${rgName} from ${subId} subscription..`)
      return false;
    }
    return true;
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

  await init();
};