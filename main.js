//const Moralis  = require('moralis/node');

Moralis.initialize( "SnYcyIpHJXpRwS4esU7uPq1ghuJXTd339TQpW5Pp" );

Moralis.serverURL = 'https://ymvrtxschj2j.moralis.io:2053/server';

init = async () => {
    hideElement( userInfo );
    hideElement( createItemForm );
    window.web3 = await Moralis.Web3.enable();
    initUser();
}

initUser = async () => {
    if ( await Moralis.User.current() ) {
        hideElement( userConnectButton );
        showElement( userProfileButton );
        showElement( openCreateItemButton );
    } else {
        showElement( userConnectButton );
        hideElement( userProfileButton );
        hideElement( openCreateItemButton );

    }
}

login = async () => {
    try {
        await Moralis.Web3.authenticate();
        initUser();
    } catch ( error ) {
        alert( error );
    }
}

logout = async () => {
    await Moralis.User.logOut();
    hideElement( userInfo );
    initUser();
}

openUserInfo = async () => {
    user = await Moralis.User.current();
    if ( user ) {
        const email = user.get( 'email' );
        if ( email ) {
            userEmail.value = email;
        } else {
            userEmail.value = "";
        }
        userUsername.value = user.get( "username" );
        const userAvatar = user.get( "avatar" );
        if ( userAvatar ) {
            avatarImg.src = userAvatar.url();
            showElement( avatarImg );
        } else {
            hideElement( avatarImg );
        }
        showElement( userInfo );
    } else {
        login();
    }
}

saveUserInfo = async () => {
    user.set( 'email', userEmail.value );
    user.set( 'username', userUsername.value );

    if ( avatarFile.files.length > 0 ) {
        const avatar = new Moralis.File( "avatar.jpg", avatarFile.files[0] );
        user.set( 'avatar', avatar );
    }

    await user.save();
    alert( "User info saved successfully!" );
    openUserInfo();
}

createItem = async () => {
    if ( createItemFile.files.length == 0 ) {
        alert( "Please select a file!" );
        return;
    } else if ( createItemFile.value.length == 0 ) {
        alert( "Please provide a name for your item!" );
        return;
    }

    const nftFile = new Moralis.File( "nftFile.jpg", createItemFile.files[0] );
    await nftFile.saveIPFS();

    const nftFilePath = nftFile.ipfs();
    const nftFileHash = nftFile.hash();

    const metadata = {
        name: createItemNameField.value,
        description: createItemDescriptionField.value,
        nftFilePath: nftFilePath,
        nftFileHash: nftFileHash
    };

    const nftFileMetadataFile = new Moralis.File( "metadata.json", { base64: btoa( JSON.stringify( metadata ) ) } );
    await nftFileMetadataFile.saveIPFS();

    const nftFileMetadataFilePath = nftFileMetadataFile.ipfs();
    const nftFileMetadataFileHash = nftFileMetadataFile.hash();

    // Simple syntax to create a new subclass of Moralis.Object.
    const Item = Moralis.Object.extend( "Item" );

    // Create a new instance of that class.
    const item = new Item();

    item.set('name', createItemNameField.value);
    item.set('description', createItemDescriptionField.value);
    item.set('nftFilePath', nftFilePath);
    item.set('nftFileHash', nftFileHash);
    item.set('metadataFilePath', nftFileMetadataFilePath);
    item.set('metadataFileHash', nftFileMetadataFileHash);
    await item.save();
    console.log(item);
}

hideElement = ( element ) => element.style.display = 'none';
showElement = ( element ) => element.style.display = 'block';

// NavBar
const userConnectButton = document.getElementById( "btnConnect" );
userConnectButton.onclick = login;

const userProfileButton = document.getElementById( "btnUserInfo" );
userProfileButton.onclick = openUserInfo;

const openCreateItemButton = document.getElementById( "btnOpenCreateItem" );
openCreateItemButton.onclick = () => showElement( createItemForm );

// User Profile

const userInfo = document.getElementById( "userInfo" );
const userUsername = document.getElementById( "txtUsername" );
const userEmail = document.getElementById( "txtEmail" );
const avatarImg = document.getElementById( "imgAvatar" );
const avatarFile = document.getElementById( "fileAvatar" );

document.getElementById( "btnCloseUserInfo" ).onclick = () => hideElement( userInfo );
document.getElementById( "btnLogOut" ).onclick = logout;
document.getElementById( "btnSaveUserInfo" ).onclick = saveUserInfo;


// Item Creation

const createItemForm = document.getElementById( "createItem" );

const createItemNameField = document.getElementById( "txtCreateItemName" );
const createItemDescriptionField = document.getElementById( "txtCreateItemDescription" );
const createItemPriceField = document.getElementById( "numCreateItemPrice" );
const createItemStatusField = document.getElementById( "selectCreateItemStatus" );
const createItemFile = document.getElementById( "fileCreateItemFile" );


document.getElementById( "btnCloseCreateItem" ).onclick = hideElement( createItemForm );
document.getElementById( "btnCreateItem" ).onclick = createItem;

init();