# butterscotch.add-posts

It is a plugins responsible for adding posts to the database.

## Decorators

| Name | getAllUsers  |
| ------------- |:-------------:|
| Description      | This method is called just before the JSON object is about to be sent to the database |
| Returns     | content |
| Parameters      | content |
| Execute in other | false |

```javascript
// To decorate this decorator
addPosts.wrap('postSubmittedContent', function (prev, content) {
    content = prev(content);
    //modify content here
    return content;
});
```
##Help Needed
[Trello](https://trello.com/b/7kfRJHgO/butterscotch-admin-ui-user-manager)
