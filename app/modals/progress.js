// global details for whole page
const options = {
  headers: {
    Authorization: "Token token=<%= iparam.freshsales_api_key %>",
    "Content-Type": "application/json",
  },
};

const spinner = `<fw-spinner size="medium" color="green"></fw-spinner>`;

var details = {
  leads_created: 0,
  leads_updated: 0,
  contacts_created: 0,
  contacts_updated: 0,
  today_tasks: 0,
  overdue_tasks: 0,
};

var duration = {
  spent: [],
  yet_to: [],
};

var today = new Date().toDateString();

// After the document is loaded ..

$(document).ready(function () {
  app.initialized().then(function (_client) {
    window.client = _client;
    client.instance
      .context()
      .then(function (context) {
        fetchTargets();
        $(".lead-spin").html(spinner);
        $(".contact-spin").html(spinner);
        $(".appoint-spin").html(spinner);
        $(".task-spin").html(spinner);
        displayData();
      })
      .catch(function (error) {
        console.error("error", error);
      });
  });
});

/**
 *  function to fetch targets for database
 */

function fetchTargets() {
  client.db
    .get("targets")
    .then(function (returnData) {
      $(".leads-num").html(returnData.leads);
      $(".contacts-num").html(returnData.contacts);
      $(".tasks-num").html(returnData.tasks);
    })
    .catch(function (error) {
      console.error("error", error);
    });
}

/**
 * call to all other functions which fetch data using freshsales API
 */

function displayData() {
  listAppointments();
  listLeadDetails();
  listContactDetails();
  listTaskDetails();
}
/**
 * fetch the upcoming appointments using api
 */
function listAppointments() {
  client.request
    .get(
      "https://<%=iparam.freshsales_subdomain%>.freshsales.io/api/appointments?filter=upcoming",
      options
    )
    .then(function (data) {
      console.log(data.response);
      var appointments_list = JSON.parse(data.response).appointments.filter(
        (obj) => {
          console.log(new Date(obj.from_date).toDateString());
          return new Date(obj.from_date).toDateString() === today;
        }
      );
      console.log("------------");
      console.log(appointments_list);
      $(".up-apts").html(`${appointments_list.length}`);
      appointments_list.forEach((element) => {
        const diff = new Date(element.end_date) - new Date(element.from_date);
        const check =
          new Date(element.end_date).getTime() - new Date().getTime();
        console.log(check);
        if (check > 0) {
          duration.yet_to.push(diff);
        }
      });
      listPastAppointments();
    })
    .catch(function (error) {
      console.error(error);
    });
}
/**
 * fetch past appointments that are today to give summary
 */
function listPastAppointments() {
  client.request
    .get(
      "https://<%=iparam.freshsales_subdomain%>.freshsales.io/api/appointments?filter=past",
      options
    )
    .then(function (data) {
      console.log(data.response);
      var appointments_list = JSON.parse(data.response).appointments.filter(
        (obj) => {
          console.log(new Date(obj.from_date).toDateString());
          return new Date(obj.from_date).toDateString() === today;
        }
      );
      console.log("------------");
      console.log(appointments_list);
      $(".past-apts").html(`${appointments_list.length}`);
      appointments_list.forEach((element) => {
        const diff = new Date(element.end_date) - new Date(element.from_date);
        const check =
          new Date(element.end_date).getTime() - new Date().getTime();
        console.log(check);
        if (check < 0) {
          duration.spent.push(diff);
        }
      });
      console.log(duration);
      const hrsspent = msToTime(duration.spent.reduce((a, b) => a + b, 0));
      const yettospent = msToTime(duration.yet_to.reduce((a, b) => a + b, 0));
      console.log("spent :" + hrsspent[0] + "hrs" + hrsspent[1] + "mins");
      console.log("spent :" + yettospent[0] + "hrs" + yettospent[1] + "mins");
      $(".appoint-spin").html("");
      $(".up-time").html(
        `${yettospent[0] + " hrs " + yettospent[1] + " mins "}`
      );
      $(".past-time").html(`${hrsspent[0] + " hrs " + hrsspent[1] + " mins "}`);
      createAppointmentChart();
    })
    .catch(function (error) {
      console.error(error);
    });
}

/**
 * fetch all the leads and filter that are created and updated today
 */
function listLeadDetails() {
  client.request
    .get(
      `https://<%=iparam.freshsales_subdomain%>.freshsales.io/api/leads/view/13001037238`,
      options
    )
    .then(function (data) {
      var arr = returnCounts(JSON.parse(data.response).leads);
      details.leads_created = arr[0];
      details.leads_updated = arr[1];
      $(".lead-spin").html("");
      $(".leadc-count").html(`${arr[0]}`);
      $(".leadu-count").html(`${arr[1]}`);
      createLeadsChart();
    })
    .catch(function (error) {
      console.error(error);
    });
}

/**
 * fetch all the contacts and then fiter that are created and updated today
 */

function listContactDetails() {
  client.request
    .get(
      `https://<%=iparam.freshsales_subdomain%>.freshsales.io/api/contacts/view/13001037250`,
      options
    )
    .then(function (data) {
      console.log(returnCounts(JSON.parse(data.response).contacts));
      const conarr = returnCounts(JSON.parse(data.response).contacts);
      details.contacts_created = conarr[0];
      details.contacts_updated = conarr[1];
      $(".contact-spin").html("");
      $(".conc-count").html(`${conarr[0]}`);
      $(".conu-count").html(`${conarr[1]}`);
      createContactsChart();
    })
    .catch(function (error) {
      console.error(error);
    });
}

/**
 * fetch tasks that are due today
 */

function listTaskDetails() {
  client.request
    .get(
      "https://<%=iparam.freshsales_subdomain%>.freshsales.io/api/tasks?filter=due_today",
      options
    )
    .then(function (data) {
      console.log(data.response);
      let dd = JSON.parse(data.response).tasks.filter((obj) => {
        return obj.status === 0;
      });
      console.log(dd + "--------------------------");
      details.today_tasks = dd.length;
      $(".taskt-count").html(`${dd.length}`);
      overdueTasks();
    })
    .catch(function (error) {
      console.error(error);
    });
}
/**
 * fetch tasks that are overdue..
 */
function overdueTasks() {
  client.request
    .get(
      "https://<%=iparam.freshsales_subdomain%>.freshsales.io/api/tasks?filter=overdue",
      options
    )
    .then(function (data) {
      console.log(data.response);
      console.log("overdue" + JSON.parse(data.response).tasks);
      details.overdue_tasks = JSON.parse(data.response).tasks.length;
      $(".task-spin").html("");
      $(".tasko-count").html(`${details.overdue_tasks}`);
      console.info(details + "hello");
      createTasksChart();
    })
    .catch(function (error) {
      console.error(error);
    });
}
/**
 * Helper Methods used for modifying data
 *
 */

/**
 *
 * @param {String} s  milliseconds
 */
function msToTime(s) {
  var ms = s % 1000;
  s = (s - ms) / 1000;
  var secs = s % 60;
  s = (s - secs) / 60;
  var mins = s % 60;
  var hrs = (s - mins) / 60;

  return [hrs, mins, secs];
}

/**
 *
 * @param {Array} dataArray
 */

function returnCounts(dataArray) {
  var created_count = 0;
  var updated_count = 0;
  dataArray.forEach((element) => {
    const ct_at = new Date(element.created_at);
    const ut_at = new Date(element.updated_at);
    console.log("---" + ct_at, ut_at);
    if (ct_at.toDateString() === today) {
      created_count += 1;
    }
    if (
      ut_at.toDateString() === today &&
      Math.floor((ut_at.getTime() - ct_at.getTime()) / 1000) > 5
    ) {
      updated_count += 1;
    }
  });
  return [created_count, updated_count];
}

/**
 * chart functions used to create required charts...
 */
function createAppointmentChart() {
  new Chart($("#appoint-chart"), {
    type: "pie",
    data: {
      labels: ["time spent", "yet to spent"],
      datasets: [
        {
          label: "Population (millions)",
          backgroundColor: ["#3e95cd", "#8e5ea2"],
          data: [
            duration.spent.reduce((a, b) => a + b, 0),
            duration.yet_to.reduce((a, b) => a + b, 0),
          ],
        },
      ],
    },
    options: {
      title: {
        display: true,
        text: "Appointment Details",
        fontSize: 22,
      },
    },
  });
}

function createLeadsChart() {
  new Chart($("#lead-chart"), {
    type: "doughnut",
    data: {
      labels: ["number of leads created", " number of leads updated"],
      datasets: [
        {
          label: "Population (millions)",
          backgroundColor: ["#3e95cd", "#8e5ea2"],
          data: [details.leads_created, details.leads_updated],
        },
      ],
    },
    options: {
      title: {
        display: true,
        text: "Leads Details",
        fontSize: 22,
      },
    },
  });
}

function createContactsChart() {
  new Chart($("#contact-chart"), {
    type: "doughnut",
    data: {
      labels: ["number of contacts created", " number of contacts updated"],
      datasets: [
        {
          label: "Population (millions)",
          backgroundColor: ["#3e95cd", "#8e5ea2"],
          data: [details.contacts_created, details.contacts_updated],
        },
      ],
    },
    options: {
      title: {
        display: true,
        text: "Contact Details",
        fontSize: 22,
      },
    },
  });
}

function createTasksChart() {
  new Chart($("#task-chart"), {
    type: "doughnut",
    data: {
      labels: ["number of overdue tasks", " number of tasks to complete today"],
      datasets: [
        {
          label: "Population (millions)",
          backgroundColor: ["#3e95cd", "#8e5ea2"],
          data: [details.overdue_tasks, details.today_tasks],
        },
      ],
    },
    options: {
      title: {
        display: true,
        text: "Task Details",
        fontSize: 22,
      },
    },
  });
}
