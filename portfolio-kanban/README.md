#Portfolio Item Kanban

![ScreenShot](/images/portfolio-item-kanban.png)

This app is a portfolio item kanban board that responds to a selected portfolio item.  

The app can display its own portfolio item selector, or subscribe to a portfolio item selection broadcast from any other app on the page.  

The portfolio item kanban will show all direct children of the selected Portfolio Item on the board.  

Configurations include:
*  Show Selector - whether or not to show the portfolio item selector inside of the app.  If selected, a portfolio item type must be chosen and the app will respond only to the selector within the app.  If not selected, then the app will respond to the published portfolio item selection from another app on the page with a portfolio item selector. 
*  Swimlanes - Setting for dividing cards into Rows by another column
*  Query to filter cards on the board

Note that if items are outside the scope of the selected project or the user's permissions, then the portfolio items will not be included in the board.  