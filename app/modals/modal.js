$(document).ready(function () {
  app.initialized().then(function (_client) {
    window.client = _client;
    client.instance
      .context()
      .then(function (context) {
        addModalEvent();
      })
      .catch(function (error) {
        console.error("error", error);
      });
  });
});

// Register Event for setting Goals Button
function addModalEvent() {
  $("#store-goals").click(function () {
    const leads = $(".leads").val();
    const contacts = $(".contacts").val();
    const tasks = $(".tasks").val();
    const data = {
      leads,
      contacts,
      tasks,
    };
    console.log(data);
    storeData(data);
  });
}

function storeData(data) {
  client.db
    .set("targets", data)
    .then(function (returnData) {
      console.log(returnData);
      $(".goal-form").hide();
      showNotification("success", "Goals saved successfully");
      client.instance.close();
    })
    .catch(function (error) {
      console.error("error occurred:", error);
    });
}

/**
 * Show notifications to the user using interface - notification API
 * @param {string} type Type of notification
 * @param {string} title Title of the message
 * @param {string} message Content of the notification message
 */
function showNotification(type, message) {
  client.interface
    .trigger("showNotify", {
      type: `${type}`,
      message: `${message}`,
    })
    .catch(function (error) {
      console.error("Notification Error : ", error);
    });
}
