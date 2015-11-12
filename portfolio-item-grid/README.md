#Portfolio Item Grid

This app is a custom list that responds to a selected portfolio item.  

The app can display its own portfolio item selector, or subscribe to a portfolio item selection broadcast from any other app on the page.  

Configurations include:
*  Show Selector - whether or not to show the portfolio item selector inside of the app.  If selected, a portfolio item type must be chosen and the app will respond only to the selector within the app.  If not selected, then the app will respond to the published portfolio item selection from another app on the page with a portfolio item selector. 
*  Top level object type - this must be an object type of the same or lower hierarchy than the selected portfolio item.  If the object type hierarchy is above the selected type, then the user will see a warning message.  
*  Query - Ability to enter a query string for the app (e.g. PlanEstimate > 0). If the query string is not valid for the selected portfolio item type, then the user will see an error notification.  

![ScreenShot](/images/grid-app-settings.png)

