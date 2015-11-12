#Portfolio Item Cumulative Flow

![ScreenShot](/images/cumulative-flow.png)

This app is a portfolio item cumulative flow diagram that responds to a selected portfolio item.  

The app can display its own portfolio item selector, or subscribe to a portfolio item selection broadcast from any other app on the page.  

Configurations include:
*  Show Selector - whether or not to show the portfolio item selector inside of the app.  If selected, a portfolio item type must be chosen and the app will respond only to the selector within the app.  If not selected, then the app will respond to the published portfolio item selection from another app on the page with a portfolio item selector. 
*  Start Date - Determines which date to use for the start date.  Options are:  Planned Start Date, Actual Start Date or custom selected date.  
*  End Date - Determines which date to use for the end date.  Options are: Today, Planned End Date, Actual End Date or a custom selected date.
*  Data Type - determines whether or not to show the Story Plan Estimate or Story count on the Y-Axis

![ScreenShot](/images/cumulative-flow-settings.png)

Note that if items are outside the scope of the selected project or the user's permissions, then the stories will not be included in the cumulative flow.  