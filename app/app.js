// For global usage
var client;
$(document).ready(function () {
  app.initialized().then(function (_client) {
    client = _client;

    client.events.on("app.activated", function () {
      client.db
        .get("targets")
        .then(function (data) {
          console.log(data);
          $("#set-goals").hide();
          const htmlData = `
                             <div class="text-center">
                                    <button
                                    class="btn btn-primary"
                                    id="view-progress"
                                    style="margin-top: 20px;"
                                    >
                                    View Progress
                                    </button>
                              </div>`;
          $("#after-set").html(htmlData);
          $("#view-progress").click(function () {
            openProgressModal();
          });
        })
        .catch(function (error) {
          registerClickEvents();
          console.error(error);
        });
    });
  });
});

function registerClickEvents() {
  $("#set-goals").click(function () {
    console.log("helllo");
    openModal();
  });
}

// Modal for setting Goals

function openModal() {
  client.interface.trigger("showModal", {
    title: "Goals Set Board",
    template: "./modals/modal.html",
  });
}

// Modal for showing progress..

function openProgressModal() {
  client.interface.trigger("showModal", {
    title: "Progress Board",
    template: "./modals/progress.html",
  });
}
