window.addEventListener("load", function() {

  // var countField = document.getElementById("countWord");
  // var countDisplay = document.getElementById("displayCount");
  // countField.addEventListener("keyup", function(evt)
  // {
  // var abbrev = countField.value;
  // var xhr = new XMLHttpRequest();
  // xhr.onreadystatechange = function()
  // {
  // if (xhr.readyState == 4 && xhr.status == 200){
  // // var resp = JSON.parse(xhr.responseText);
  //   var resp = xhr.response;
  // // countDisplay.innerHTML = "<li>" + resp.count + " words match "
  // // + resp.abbrev + "</li>";
  //   countDisplay.innerHTML = "";
  //     for (var i=0; i<resp.length; i++) {
  //       var item = document.createElement("li");
  //       item.innerHTML = resp[i].count + " words match " + resp[i].abbrev;
  //       countDisplay.appendChild(item);
  //     }
  //   }
  // }
  // var uri = "/wordsapi/v2/count/" + abbrev;
  // var caseCount = document.getElementById("caseCount").checked;
  // if(caseCount) {
  //   uri += "?caseSensitive=true";
  // }
  // console.log(uri);
  // xhr.open("GET", uri);
  // xhr.responseType = 'json';
  // xhr.send();
  // });

  var searchField = document.getElementById("searchWord");
  var searchList = document.getElementById("wordlist");
  searchField.addEventListener("keyup", function(evt) {
    var abbrev = searchField.value;
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {
      if (xhr.readyState == 4 && xhr.status == 200) {
        searchList.innerHTML = "";
        if (xhr.response.length === 0) {
          addWord(evt);
        } else {
          for (var i = 0; i < xhr.response.length; i++) {
            var opt = document.createElement("option");
            opt.value = xhr.response[i].id;
            opt.label = xhr.response[i].word;
            searchList.appendChild(opt);
          }
        }
      }
    }
    var uri = "/wordsapi/v2/search/" + abbrev;
    var params = []; //Empty array for option URI parameters
    var caseSearch = document.getElementById("caseWord").checked;
    var thresh = searchField.dataset.threshold;
    if (thresh && Number(thresh) > 0) {
      params.push("threshold=" + Number(thresh)); //add to array
    }
    if (caseSearch) {
      params.push("caseSensitive=true"); //add to array
    }
    if (params.length) { //do we have any optional parameters?
      uri += "?" + params.join("&"); //Concatenate with &s, append after ?
    }
    // console.log(uri);
    xhr.open("GET", uri);
    xhr.responseType = 'json';
    xhr.send();
  });

  //Word search keyup callback
  searchList.addEventListener("change", function() {
    searchField.value = searchList.options[searchList.selectedIndex].label;
    var wordId = searchList.options[searchList.selectedIndex].value;
    displayWordData(wordId);
  });

  function displayWordData(id) {
    var uri = "/wordsapi/v2/dictionary/" + id;
    var xhr = new XMLHttpRequest();
    var wordDisplay = document.getElementById("wordDisplay");
    wordDisplay.innerHTML = "";
    xhr.onreadystatechange = function() {
      if (xhr.readyState == 4 && xhr.status == 200) {
        //don't need this with xhr.responseType = 'json';
        //var resp = JSON.parse(xhr.responseText);
        var resp = xhr.response;
        var p = document.createElement("p");
        p.innerHTML = "Word ID: " + resp.id + " Word: " + resp.word + " ";
        wordDisplay.appendChild(p);
        //get twitter stuff
        showTweets(xhr.response.twitter);
        //delete button
        var dbutton = document.createElement("Button");
        dbutton.setAttribute("wordId", id);
        var t = document.createTextNode("Delete Word");
        dbutton.appendChild(t);
        p.appendChild(dbutton);
        dbutton.addEventListener("click", deleteWord);
        //edit button
        var ebutton = document.createElement("Button");
        ebutton.setAttribute("wordId", id);
        ebutton.setAttribute("word", resp.word);
        var t = document.createTextNode("Edit Word");
        ebutton.appendChild(t);
        p.appendChild(ebutton);
        ebutton.addEventListener("click", editWord);

      }
    }
    xhr.open("GET", uri);
    xhr.responseType = 'json';
    xhr.send();
  }

  function showTweets(tweets) {
    var tweetList = tweets.statuses;
    var twitterList = document.getElementById("twitterList");
    twitterList.innerHTML = "";
    for (var i = 0; i < tweetList.length; i++) {
      var tweet = tweetList[i].text;
      var tweetDiv = document.createElement("div");
      tweetDiv.setAttribute("id", "tweetDiv");
      tweet = linkURLs(tweet);
      tweet = linkHashtags(tweet);

      tweetDiv.innerHTML = tweet;
      twitterList.innerHTML += tweet + "<br>";
    }
  }

  function linkURLs(text) {
    var pattern = /(https?:\/\/\S+)/g;
    var newText = text.replace(pattern, "<a href='$1' target='_blank'>$1</a>");
    return newText;
  }

  function linkHashtags(text) {
    var pattern = /(#(\w+))/g;
    var newText = text.replace(pattern, "<a href='https://twitter.com/search?q=%23$2' target='_blank'>$1</a>")
    return newText;
  }

  function deleteWord(e) {
    var wordId = e.target.getAttribute("wordId");
    var uri = "/wordsapi/v2/dictionary/" + wordId;
    var xhr = new XMLHttpRequest();
    var wordDisplay = document.getElementById("wordDisplay");
    wordDisplay.innerHTML = "";
    xhr.onreadystatechange = function() {
      if (xhr.status == 202) {
        // var p = document.createElement("p");
        wordDisplay.innerHTML = "Delete successful";
        // wordDisplay.appendChild(p);
      }
    }
    xhr.open("DELETE", uri);
    xhr.responseType = 'json';
    xhr.send();
  }

  function editWord(e) {
    var wordId = e.target.getAttribute("wordId");
    var body = document.querySelector("body");
    var editForm = document.createElement("form");
    var word = e.target.getAttribute("word");
    var wordBox = document.createElement("input");
    wordBox.value = word;
    editForm.appendChild(wordBox);
    var submit = document.createElement("input");
    submit.type = "submit";
    submit.value = "Submit";
    editForm.appendChild(submit);
    body.appendChild(editForm);
    submit.addEventListener("click", function(e) {
      e.preventDefault();
      var newWord = wordBox.value;
      console.log(newWord);
      var obj = {
        id: wordId,
        word: newWord
      };
      var uri = "/wordsapi/v2/dictionary/" + wordId;
      var xhr = new XMLHttpRequest();
      var wordDisplay = document.getElementById("wordDisplay");
      wordDisplay.innerHTML = "";
      xhr.onreadystatechange = function() {
        if (xhr.readyState == 4 && xhr.status == 200) {
          var resp = xhr.response;
          var p = document.createElement("p");
          p.innerHTML = "Word ID: " + resp.id + " Word: " + resp.word + " ";
          wordDisplay.appendChild(p);
        }
        if (xhr.status == 400) {
          wordDisplay.innerHTML = "Duplicate Word";
        } else {
          wordDisplay.innerHTML = "Other Error";
        }
      }
      xhr.open("PUT", uri);
      xhr.responseType = 'json';
      xhr.setRequestHeader("Content-type", "application/json");
      xhr.send(JSON.stringify(obj));
    });
  }

  // var add = document.addButton;
  // add.addWord.addEventListener("click", function(e) {
  function addWord(e) {
    e.preventDefault();
    var removeForm = document.getElementById("wordForm");
    console.log(removeForm);
    if(removeForm){
      removeForm.parentNode.removeChild(removeForm);
    }
    var body = document.querySelector("body");
    var wordForm = document.createElement("form");
    wordForm.setAttribute("id", "wordForm");

    var newWord = document.createElement("input");
    newWord.type = "text";
    newWord.value = searchField.value;
    newWord.placeholder = "New Word";
    wordForm.appendChild(newWord);


    var submit = document.createElement("input");
    submit.type = "submit";
    submit.value = "Add Word";
    wordForm.appendChild(submit);
    body.appendChild(wordForm);
    submit.addEventListener("click", function(e) {
      e.preventDefault();
      var obj = {
        word: newWord.value
      };
      console.log(newWord.value);
      var uri = "/wordsapi/v2/dictionary/" + newWord.value;
      var xhr = new XMLHttpRequest();
      var wordDisplay = document.getElementById("wordDisplay");
      wordDisplay.innerHTML = "";
      xhr.onreadystatechange = function() {
        if (xhr.readyState === 4 && xhr.status === 200) {
          var resp = xhr.response;
          var p = document.createElement("p");
          p.innerHTML = "Word ID: " + resp.id + " Word: " + resp.word + " ";
          wordDisplay.appendChild(p);
        } else if (xhr.status == 400) {
          wordDisplay.innerHTML = "Duplicate Word";
        } else if (xhr.status >= 500) {
          wordDisplay.innerHTML = "Some other error";
        }
      }
      xhr.open("POST", uri);
      xhr.responseType = 'json';
      xhr.setRequestHeader("Content-type", "application/json");
      xhr.send(JSON.stringify(obj));
    });
  }
  // });
});
