


/** ======================================================== Event Functions ======================================================== */



function resetUserProps(e) {
  var userProps = PropertiesService.getUserProperties();
  userProps.deleteAllProperties();

  var selectTaskListCard = buildTaskListSelectCard();
  var nav = CardService.newNavigation().updateCard(selectTaskListCard);
  return CardService.newActionResponseBuilder()
    .setNavigation(nav)
    .build();
}

/**
 * Callback for rendering the homepage card.
 * @return {CardService.Card} The card to show to the user.
 */
function onHomepage(e) {
  return buildTasksCard();
}

function generateCalendarEvent(e) {
  var taskListId = e.commonEventObject.parameters.taskListId;
  var calendarId = e.commonEventObject.parameters.calendarId;

  var tasks = getTasks(taskListId);
  var description = "What I did today:";
  tasks.forEach(task => {
    description = description + "\n - " + task.title
  });

  createCalendarEvent(calendarId, "Done!", description);
  clearTasks(taskListId);
}

function navToSelectTaskList(e) {
  var selectTaskListCard = buildTaskListSelectCard();
  var nav = CardService.newNavigation().updateCard(selectTaskListCard);
  return CardService.newActionResponseBuilder()
    .setNavigation(nav)
    .build();
}

function navToSelectCalendarList(e) {
  var selectCalendarCard = buildCalendarSelectCard();
  var nav = CardService.newNavigation().updateCard(selectCalendarCard);
  return CardService.newActionResponseBuilder()
    .setNavigation(nav)
    .build();
}

function selectTaskList(e) {
  var userProps = PropertiesService.getUserProperties();
  userProps.setProperty("taskListId", e.commonEventObject.parameters.taskListId);
  userProps.setProperty("taskListName", e.commonEventObject.parameters.taskListName);
  
  var tasksCard = buildTasksCard();
  var nav = CardService.newNavigation().updateCard(tasksCard);
  return CardService.newActionResponseBuilder()
    .setNavigation(nav)
    .build();
}

function selectCalendar(e) {
  var userProps = PropertiesService.getUserProperties();
  userProps.setProperty("calendarId", e.commonEventObject.parameters.calendarId);
  userProps.setProperty("calendarName", e.commonEventObject.parameters.calendarName);
  
  var tasksCard = buildTasksCard();
  var nav = CardService.newNavigation().updateCard(tasksCard);
  return CardService.newActionResponseBuilder()
    .setNavigation(nav)
    .build();
}

function refresh(e) {
  var tasksCard = buildTasksCard();
  var nav = CardService.newNavigation().updateCard(tasksCard);
  return CardService.newActionResponseBuilder()
    .setNavigation(nav)
    .build();
}



/** ======================================================== UI Functions ======================================================== */



function buildTasksCard() {
  var userProps = PropertiesService.getUserProperties();
  var taskList = {
    'id': userProps.getProperty("taskListId"),
    'name': userProps.getProperty("taskListName")
  }

  var calendar = {
    'id': userProps.getProperty("calendarId"),
    'name': userProps.getProperty("calendarName")
  }

  var cardBuilder = CardService.newCardBuilder();

  if(taskList && taskList.id && taskList.name) {
    // build the tasks from taskList
    var calendarSection = buildCalendarSection(calendar);

    var tasksSection = buildTasksSection(taskList);

    var footerButtonAction = CardService.newAction()
      .setFunctionName('generateCalendarEvent')
      .setParameters({
        'taskListId': taskList.id,
        'calendarId': calendar.id ? calendar.id : "primary"
      });

    var footer = CardService.newFixedFooter()
      .setPrimaryButton(CardService.newTextButton()
        .setText('Add Tasks To Calendar')
        .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
        .setBackgroundColor("#0066cc")
        .setOnClickAction(footerButtonAction));

    cardBuilder.addSection(calendarSection)
      .addSection(tasksSection)
      .setFixedFooter(footer);
  }
  else {
    // build empty state card
    var navToSelectTaskListButtonAction = CardService.newAction()
      .setFunctionName("navToSelectTaskList");

    var navToSelectTaskListButton = CardService.newTextButton()
      .setText("Select Default Task List")
      .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
      .setOnClickAction(navToSelectTaskListButtonAction);

    var emptySection = CardService.newCardSection()
      .addWidget(navToSelectTaskListButton);
      
    cardBuilder.addSection(emptySection)
  }
  return cardBuilder.build();
}

function buildCalendarSection(calendar) {
  var calendarSection = CardService.newCardSection()
    .setHeader("Calendar");

  var selectCalendarButtonAction = CardService.newAction()
    .setFunctionName("navToSelectCalendarList");

  var selectCalendarButton = CardService.newTextButton()
    .setText("Select")
    .setTextButtonStyle(CardService.TextButtonStyle.TEXT)
    .setOnClickAction(selectCalendarButtonAction);

  var contentText = "primary";

  if(calendar && calendar.id && calendar.name) {
    //build the display
    contentText = calendar.name;
  }

  var selectCalendarKeyValue = CardService.newKeyValue()
    .setContent(contentText)
    .setButton(selectCalendarButton)

  return calendarSection.addWidget(selectCalendarKeyValue);
}

function buildTasksSection(taskList) {
  var tasksSection = CardService.newCardSection()
    .setHeader("Completed Tasks");

  if(taskList && taskList.id && taskList.name) {
    // build the list
    var refreshButtonAction = CardService.newAction()
      .setFunctionName("refresh");

    var refreshButton = CardService.newTextButton()
      .setText("Refresh")
      .setTextButtonStyle(CardService.TextButtonStyle.TEXT)
      .setOnClickAction(refreshButtonAction);
    
    var refreshKeyValue = CardService.newKeyValue()
      .setContent(taskList.name)
      .setButton(refreshButton)

    tasksSection.addWidget(refreshKeyValue);

    var tasks = getTasks(taskList.id);

    if(tasks.length > 0) {
      tasks.map(function (task) {
        var taskSummaryWidget = CardService.newKeyValue()
          .setContent(task.title)
          .setIcon(CardService.Icon.DESCRIPTION);
  
        if (task.notes) {
          taskSummaryWidget.setBottomLabel(task.notes);
        }
        tasksSection.addWidget(taskSummaryWidget);
      });
    }
    else {
      var noTasksText = CardService.newTextParagraph()
        .setText("No completed tasks in list.");

      tasksSection.addWidget(noTasksText);
    }
  }
  else {
    // build an empty state
    var invalidStateText = CardService.newTextParagraph()
      .setText("The Task List is invalid.");

    tasksSection.addWidget(invalidStateText);
  }
  return tasksSection;
}

function buildTaskListSelectCard() {
  var cardBuilder = CardService.newCardBuilder();

  var taskListsHeader = CardService.newCardHeader()
      .setTitle("Task Lists");

  var taskListsSection = CardService.newCardSection();

  var taskLists = getTaskLists();

  taskLists.map(function(taskList) {
    var selectTaskListButtonAction = CardService.newAction()
      .setFunctionName("selectTaskList")
      .setParameters({
        'taskListId': taskList.id,
        'taskListName': taskList.name
      });

    var selectTaskListButton = CardService.newTextButton()
      .setText("Make Default")
      .setTextButtonStyle(CardService.TextButtonStyle.TEXT)
      .setOnClickAction(selectTaskListButtonAction);

    var taskSummaryWidget = CardService.newKeyValue()
      .setContent(taskList.name)
      .setButton(selectTaskListButton);

      taskListsSection.addWidget(taskSummaryWidget);
  });
    
  return cardBuilder.setHeader(taskListsHeader)
    .addSection(taskListsSection)
    .build();
}

function buildCalendarSelectCard() {
  var cardBuilder = CardService.newCardBuilder();

  var calendarsHeader = CardService.newCardHeader()
      .setTitle("Calendars");

  var calendarsSection = CardService.newCardSection();

  var calendars = getCalendars();

  if(calendars.length > 0) {
    calendars.map(function(calendar) {
      var selectCalendarButtonAction = CardService.newAction()
        .setFunctionName("selectCalendar")
        .setParameters({
          'calendarId': calendar.id,
          'calendarName': calendar.name,
        });
  
      var selectCalendarButton = CardService.newTextButton()
        .setText("Make Default")
        .setTextButtonStyle(CardService.TextButtonStyle.TEXT)
        .setOnClickAction(selectCalendarButtonAction);
  
      var calendarWidget = CardService.newKeyValue()
        .setContent(calendar.name)
        .setButton(selectCalendarButton);
  
        calendarsSection.addWidget(calendarWidget);
    });  
  }
  else {
    var noCalendarsText = CardService.newTextParagraph()
      .setText("No calendars in list.");

    calendarsSection.addWidget(noCalendarsText);
  }
  
  return cardBuilder.setHeader(calendarsHeader)
    .addSection(calendarsSection)
    .build();
}




/** ======================================================== Helper Functions ======================================================== */



/**
 * Returns the ID and name of every task list in the user's account.
 * @return {Array.<Object>} The task list data.
 */
function getTaskLists() {
  var taskLists = Tasks.Tasklists.list().getItems();
  if (!taskLists) {
    return [];
  }
  return taskLists.map(function (taskList) {
    return {
      id: taskList.getId(),
      name: taskList.getTitle()
    };
  });
}

/**
 * Returns information about the tasks within a given task list.
 * @param {String} taskListId The ID of the task list.
 * @return {Array.<Object>} The task data.
 */
function getTasks(taskListId) {
  var tasks = Tasks.Tasks.list(taskListId, { maxResults: 100, showHidden: true, showCompleted: true}).getItems();
  if (!tasks) {
    return [];
  }

  console.log(tasks);

  return tasks.map(function (task) {
    return {
      id: task.getId(),
      title: task.getTitle(),
      notes: task.getNotes(),
      completed: Boolean(task.getCompleted())
    };
  }).filter(task => {
    return (task.title && task.completed === true);
  });
}

function clearTasks(taskListId) {
  var tasks = getTasks(taskListId);
  tasks.forEach(task => {
    Tasks.Tasks.remove(taskListId, task.id);
  });
}

function getCalendars() {
  var calendars;
  var pageToken;
  var results = [];
  do {
    calendars = Calendar.CalendarList.list({
      maxResults: 100,
      pageToken: pageToken
    });
    if (calendars.items && calendars.items.length > 0) {
      for (var i = 0; i < calendars.items.length; i++) {
        var calendar = calendars.items[i];
        results.push({
          'id': calendar.id,
          'name': calendar.summary
        });
      }
    } else {
      console.log('No calendars found.');
    }
    pageToken = calendars.nextPageToken;
  } while (pageToken);

  return results;
}

/**
 * Creates an event in the user's default calendar.
 */
function createCalendarEvent(calendarId, summary, description) {
  var start = getRelativeDate(0, 12);
  var end = getRelativeDate(0, 13);
  var event = {
    summary: summary,
    description: description,
    start: {
      date: formatDate(start)
    },
    end: {
      date: formatDate(end)
    }
  };
  event = Calendar.Events.insert(event, calendarId);
  Logger.log(event);
}

/**
 * Helper function to get a new Date object relative to the current date.
 * @param {number} daysOffset The number of days in the future for the new date.
 * @param {number} hour The hour of the day for the new date, in the time zone
 *     of the script.
 * @return {Date} The new date.
 */
function getRelativeDate(daysOffset, hour) {
  var date = new Date();
  date.setDate(date.getDate() + daysOffset);
  date.setHours(hour);
  date.setMinutes(0);
  date.setSeconds(0);
  date.setMilliseconds(0);
  return date;
}

function formatDate(date) {
  var d = new Date(date),
      month = '' + (d.getMonth() + 1),
      day = '' + d.getDate(),
      year = d.getFullYear();

  if (month.length < 2) 
      month = '0' + month;
  if (day.length < 2) 
      day = '0' + day;

  return [year, month, day].join('-');
}
