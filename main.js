//const Moralis  = require('moralis/node');

Moralis.initialize("SnYcyIpHJXpRwS4esU7uPq1ghuJXTd339TQpW5Pp");

Moralis.serverURL = 'https://ymvrtxschj2j.moralis.io:2053/server';

init = async () => {
    hideElement(userInfo);
    hideElement(createItemForm);
    window.web3 = await Moralis.Web3.enable();
    initUser();
}

initUser = async () => {
    if (await Moralis.User.current()) {
        hideElement(userConnectButton);
        showElement(userProfileButton);
        showElement(openCreateItemButton);
    } else {
        showElement(userConnectButton);
        hideElement(userProfileButton);
        hideElement(openCreateItemButton);

    }
}

login = async () => {
    try {
        await Moralis.Web3.authenticate();
        initUser();
    } catch (error) {
        alert(error);
    }
}

logout = async () => {
    await Moralis.User.logOut();
    hideElement(userInfo);
    initUser();
}

openUserInfo = async () => {
    user = await Moralis.User.current();
    if (user) {
        const email = user.get('email');
        if (email) {
            userEmail.value = email;
        } else {
            userEmail.value = "";
        }
        userUsername.value = user.get("username");
        const userAvatar = user.get("avatar");
        if (userAvatar) {
            avatarImg.src = userAvatar.url();
            showElement(avatarImg);
        } else {
            hideElement(avatarImg);
        }
        showElement(userInfo);
    } else {
        login();
    }
}

saveUserInfo = async () => {
    user.set('email', userEmail.value);
    user.set('username', userUsername.value);

    if (avatarFile.files.length > 0) {
        const avatar = new Moralis.File("avatar.jpg", avatarFile.files[0]);
        user.set('avatar', avatar);
    }

    await user.save();
    alert("User info saved successfully!");
    openUserInfo();
}

hideElement = (element) => element.style.display = 'none';
showElement = (element) => element.style.display = 'block';

const userConnectButton = document.getElementById("btnConnect");
userConnectButton.onclick = login;

const userProfileButton = document.getElementById("btnUserInfo");
userProfileButton.onclick = openUserInfo;

const userInfo = document.getElementById("userInfo");
const userUsername = document.getElementById("txtUsername");
const userEmail = document.getElementById("txtEmail");
const avatarImg = document.getElementById("imgAvatar");
const avatarFile = document.getElementById("fileAvatar");

document.getElementById("btnCloseUserInfo").onclick = () => hideElement(userInfo);
document.getElementById("btnLogOut").onclick = logout;
document.getElementById("btnSaveUserInfo").onclick = saveUserInfo;

const createItemForm = document.getElementById("createItem");

const createItemNameField = document.getElementById("txtCreateItemName");
const createItemDescriptionField= document.getElementById("txtCreateItemDescription");
const createItemPriceField = document.getElementById("numCreateItemPrice");
const createItemStatusField = document.getElementById("selectCreateItemStatus");
const createItemFile = document.getElementById("fileCreateItemFile");

const openCreateItemButton = document.getElementById("btnOpenCreateItem");
openCreateItemButton.onclick = () => showElement(createItemForm);
document.getElementById("btnCloseCreateItem").onclick = hideElement(createItemForm);


init();