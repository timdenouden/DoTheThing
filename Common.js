
/**
 * Callback for rendering the homepage card.
 * @return {CardService.Card} The card to show to the user.
 */
function onHomepage(e) {
  return createNavigationCard(null)
}

function handleDropdownSelection(e) {
  var selectedTaskListId = e.commonEventObject.formInputs.taskListsField.stringInputs.value;
  return buildTaskCard(selectedTaskListId);
}

function generateCalendarEvent(e) {
  console.log(e);
}

function goToTasksCard(e) {
  var tasksCard = buildTasksCard(e.parameters.id, e.parameters.name);

  var userProps = PropertiesService.getUserProperties();
  userProps.setProperties({
    'id': e.parameters.id,
    'name': e.parameters.name
  });

  var nav = CardService.newNavigation().pushCard(tasksCard);
  return CardService.newActionResponseBuilder()
    .setNavigation(nav)
    .build();
}

function createNavigationCard() {
  var userProps = PropertiesService.getUserProperties();
  console.log(userProps.getProperties());

  var taskLists = getTaskLists();

  var buttonSet = CardService.newButtonSet();

  taskLists.forEach(function (taskList) {
    buttonSet.addButton(createToCardButton(taskList));
  });

  var card = CardService.newCardBuilder()
    .setHeader(
      CardService.newCardHeader().setTitle('Task Lists')
    ).addSection(
      CardService.newCardSection().addWidget(buttonSet)
    );
  return card.build();
}

function createToCardButton(taskList) {
  var action = CardService.newAction()
    .setFunctionName('goToTasksCard')
    .setParameters({
      'id': taskList.id,
      'name': taskList.name
    });
  var button = CardService.newTextButton()
    .setText(taskList.name)
    .setOnClickAction(action);
  return button;
}

function buildTasksCard(taskListId, taskListName) {
  var tasksSection = buildTasksSection(taskListId);

  var footerButtonAction = CardService.newAction()
    .setFunctionName('generateCalendarEvent')
    .setParameters({
      'id': taskListId,
      'name': taskListName
    });

  var footer = CardService.newFixedFooter()
    .setPrimaryButton(CardService.newTextButton()
      .setText('Powered by cataas.com')
      .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
      .setBackgroundColor("#D32F2F")
      .setOnClickAction(footerButtonAction));

  var card = CardService.newCardBuilder()
    .setHeader(CardService.newCardHeader().setTitle(taskListName).setSubtitle(taskListId))
    .addSection(tasksSection);

  if (taskListId) {
    footerButtonAction.setParameters({
      'id': taskListId,
      'name': taskListName
    });
    card.setFixedFooter(footer);
  }

  return card.build();
}

function buildTasksSection(taskListId) {
  var tasksSection = CardService.newCardSection();

  if (!taskListId) {
    tasksSection.addWidget(CardService.newTextParagraph()
      .setText("Please select a task list."));

    return CardService.newCardBuilder()
      .setHeader(tasksHeader)
      .addSection(tasksSection)
      .build();
  }

  var tasks = getTasks(taskListId);

  tasks.map(function (task) {
    var taskSummaryWidget = CardService.newKeyValue()
      .setContent(task.title)
      .setIcon(CardService.Icon.DESCRIPTION);

    if (task.notes) {
      taskSummaryWidget.setBottomLabel(task.notes);
    }
    tasksSection.addWidget(taskSummaryWidget);
  });

  return tasksSection;
}

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
  var tasks = Tasks.Tasks.list(taskListId).getItems();
  if (!tasks) {
    return [];
  }
  return tasks.map(function (task) {
    return {
      id: task.getId(),
      title: task.getTitle(),
      notes: task.getNotes(),
      completed: Boolean(task.getCompleted())
    };
  }).filter(function (task) {
    return task.title;
  });
}

/**
 * Creates an event in the user's default calendar.
 */
function createEvent(summary, description) {
  var calendarId = 'primary';
  var start = getRelativeDate(1, 12);
  var end = getRelativeDate(1, 13);
  var event = {
    summary: summary,
    description: description,
    start: {
      dateTime: start.toISOString()
    },
    end: {
      dateTime: end.toISOString()
    }
  };
  event = Calendar.Events.insert(event, calendarId);
  Logger.log('Event ID: ' + event.id);
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