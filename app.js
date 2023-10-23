//jshint esversion:6

const mongoose = require('mongoose');
const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const _=require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://antispam:AntiSpam@cluster0.yyuhphk.mongodb.net/todoListDB",{useNewUrlParser: true})
.then(() => {
  console.log("Connected to MongoDB");
})
.catch((err) => {
  console.error("Error connecting to MongoDB:", err);
});
 
const itemsSchema={
  Name: String
}

const Item=mongoose.model('Item',itemsSchema);


const ListSchema={
  Name: String,
  items:[itemsSchema]
}
const List= mongoose.model('List',ListSchema);


const item1= new Item({
  Name:"Click + to add Task"
});

const item2= new Item({
  Name:"Click on checkBox to Delete Completed Task"
});

const defItems=[item1,item2];

const today = new Date();


const options = {
  weekday: "long",
  day: "numeric",
  month: "long"
};
let day = today.toLocaleDateString("en-US", options);
console.log(day);

app.get("/", function(req, res) {
  Item.find({}).then(foundItems => {
    if (foundItems.length === 0) {
      // If the database is empty, insert default items
      return Item.insertMany(defItems);
    } else {
      // If the database has items, just render them
      return Promise.resolve(foundItems);
    }
  }).then(itemsToRender => {
    const listName = req.body.list;
    // Render the items (whether they are fetched from the database or inserted as defaults)
    res.render("list", { listTitle: day, newListItems: itemsToRender });
  }).catch(err => {
    console.error("Error:", err);
  });
  
  
});

app.get("/:CustomList", function(req,res){
  let customListName=_.capitalize(req.params.CustomList);

  List.findOne({Name:customListName}).then(foundList=>{
   if(!foundList){
    const list = new List({
      Name: customListName,
      items: defItems
    })
  
    list.save();
    res.redirect("/"+customListName);
   }else{
    res.render("list", {listTitle: foundList.Name,  newListItems: foundList.items});
   }
  })
  
});

app.post("/", function(req, res){
  
  const itemName = req.body.newItem;
  const listName = req.body.list;
  
  const item= new Item({
     Name: itemName
  });

  if(listName===day){

    item.save();
    res.redirect("/");
  }else{
    List.findOne({Name:listName}).then(foundList => {
      foundList.items.push(item);
      foundList.save();
      res.redirect("/"+foundList.Name);
    })
  }


});




app.post("/delete", function(req, res) {
  const taskCompletedId = req.body.checkbox;
  const KName = req.body.hiddenItem;
  const listName = KName.trim();
  
  if (listName === day) {
    Item.findByIdAndRemove(taskCompletedId)
      .then(() => {
        console.log("Delete kr diya bhai");
        res.redirect("/");
      })
      .catch(err => {
        console.error("Error deleting item:", err);
        res.status(500).send("Internal Server Error");
      });
  } else {
    List.findOneAndUpdate(
      { Name: listName },
      { $pull: { items: { _id: taskCompletedId } } }, // Remove the item with the matching _id
      { new: true }
    )
      .then(updatedList => {
        if (!updatedList) {
          console.log(`No document with Name "${listName}" found.`);
          // return res.status(404).send("List not found");
        }

        console.log(`Deleted the item "${taskCompletedId}" from the "${listName}" list.`);
        res.redirect("/" + listName);
      })
      .catch(err => {
        console.error("Error deleting item:", err);
        // res.status(500).send("Internal Server Error");
      });
  }
});





//WORKING CORRECTLY COMPLETELY
// app.post("/delete", function(req, res) {
//   const taskCompletedId = req.body.checkbox;
//   const KName = req.body.hiddenItem;
//   const listName = KName.trim();
  
//   if (listName === day) {
//     Item.findByIdAndRemove(taskCompletedId)
//       .then(() => {
//         console.log("Delete kr diya bhai");
//         res.redirect("/");
//       })
//       .catch(err => {
//         console.error("Error deleting item:", err);
//         // res.status(500).send("Internal Server Error");
//       });
//   } else {
//     List.findOne({ Name: listName })
//       .then(listObject => {
//         if (!listObject) {
//           console.log(`No document with Name "${listName}" found.`);
//           // return res.status(404).send("List not found");
//         }
  
//         const itemIndex = listObject.items.findIndex(item => item._id.toString() === taskCompletedId);
  
//         if (itemIndex !== -1) {
//           listObject.items.splice(itemIndex, 1);
//           return listObject.save();
//         } else {
//           console.log(`Item "${taskCompletedId}" not found in the "${listName}" list.`);
//           return Promise.resolve(); // Continue the Promise chain
//         }
//       })
//       .then(() => {
//         console.log(`Deleted the item "${taskCompletedId}" from the "${listName}" list.`);
//         res.redirect("/" + listName);
//       })
//       .catch(err => {
//         console.error("Error deleting item:", err);
//         // res.status(500).send("Internal Server Error");
//       });
//   }
// });



app.get("/about", function(req, res){
  res.render("about");
});

app.listen(process.env.PORT ||3000, function() {
  console.log("Server started on port 3000");
});








// THIS IS THE CODE WORKING IN MONGOSH 
// db.lists.findOne({ Name: 'Home' }).items.find(item => item.Name === 'Hie')


//WORKING ELSE CODE ONLY FOR ONE ITEM
// else{
//   // console.log(listName);
//   List.findOne({ Name: 'Home' }).then((homeObject) => {
//     if (!homeObject) {
//       console.log('No document with Name "Home" found.');
      
//     }
  
//     const hieItem = homeObject.items.find(item => item.Name === 'Hie');
  
//     if (hieItem) {
//       console.log('Found "Hie" item:', hieItem);
//     } else {
//       console.log('Item "Hie" not found in the "Home" object.');
//     }
  
// });


// }