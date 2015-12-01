#Portfolio Item Sankey Graph
 
This app is a portfolio item sankey graph that responds to a selected portfolio item.  

![ScreenShot](/images/portfolio-item-sankey-graph.png)  

The app can display its own portfolio item selector, or subscribe to a portfolio item selection broadcast from any other app on the page.  

The portfolio item sankey graph will show dependencies between stories that are decendants of the selected portfolio item.    

If a story has a predecessor that is not a decendent of the selected portfolio item, the predecessor will be displayed with a black bar (instead of the display color for the item or the default blue color for no display color).
If an item has a successor that is not a decendent of the selected portfolio item, the successor will not be displayed on the graph.  

Configurations include:
*  Show Selector - whether or not to show the portfolio item selector inside of the app.  If selected, a portfolio item type must be chosen and the app will respond only to the selector within the app.  If not selected, then the app will respond to the published portfolio item selection from another app on the page with a portfolio item selector. 

Note that if items are outside the scope of the selected project or the user's permissions, then the stories will not be included in the board.  