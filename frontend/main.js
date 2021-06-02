//const Moralis  = require('moralis/node');

Moralis.initialize( "kaBvvlEVwlot4E7VelBssdgDVmlDTyD6rykYzrr9" );
Moralis.serverURL = 'https://hmdky9gx8kwa.moralis.io:2053/server';

const TOKEN_CONTRACT_ADDRESS = "0x3aD12678d7E3829A77AEEb79a9eDc3Cf6E848047";
const MARKET_CONTRACT_ADDRESS = "0xd233Cd4E0BCA99A87a7b353122493CB81674236F";

init = async () => {
    hideElement( userItemSection );
    hideElement( userInfo );
    hideElement( createItemForm );
    window.web3 = await Moralis.Web3.enable();
    window.tokenContract = new web3.eth.Contract( tokenContractABI, TOKEN_CONTRACT_ADDRESS );
    window.marketplaceContract = new web3.eth.Contract( marketplaceContractABI, MARKET_CONTRACT_ADDRESS );
    initUser();
    loadItems();

    const soldItemsQuery = new Moralis.Query( 'SoldItems' );
    const soldItemsSubscription = await soldItemsQuery.subscribe();
    soldItemsSubscription.on( "create", onItemsSold );

    const itemsAddedQuery = new Moralis.Query( 'ItemsForSale' );
    const itemAddedSubscription = await itemsAddedQuery.subscribe();
    itemAddedSubscription.on( "create", onItemAdded );
}

onItemsSold = async ( item ) => {
    const listing = document.getElementById( `item-${ item.attributes.uid }` );
    if ( listing ) {
        listing.parentNode.removeChild( listing );
    }
    user = await Moralis.User.current();
    if ( user ) {
        if ( user.get( 'accounts' ).includes( item.attributes.buyer ) ) {
            const params = { uid: `${ item.attributes.uid }` };
            const soldItem = await Moralis.Cloud.run( 'getItem', params );
            if ( soldItem ) {
                getAndRenderItemData( soldItem, renderUserItem );
            }
        }
    }
}

onItemAdded = async ( item ) => {
    const params = { uid: `${ item.attributes.uid }` };
    const addedItem = await Moralis.Cloud.run( 'getItem', params );
    if ( addedItem ) {
        user = await Moralis.User.current();
        if ( user ) {
            if ( user.get( 'accounts' ).includes( addedItem.ownerOf ) ) {
                getAndRenderItemData( addedItem, renderUserItem );
                return;
            }
        }
        getAndRenderItemData( addedItem, renderItem );
    }
}

initUser = async () => {
    if ( await Moralis.User.current() ) {
        hideElement( userConnectButton );
        showElement( userProfileButton );
        showElement( openCreateItemButton );
        showElement( openUserItemsButton );
        loadUserItems();
    } else {
        showElement( userConnectButton );
        hideElement( userProfileButton );
        hideElement( openCreateItemButton );
        hideElement( openUserItemsButton );

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

loadUserItems = async () => {
    const ownedItems = await Moralis.Cloud.run( "getUserItems" );
    ownedItems.forEach( item => {
        getAndRenderItemData( item, renderUserItem );
    } );
}

loadItems = async () => {
    const items = await Moralis.Cloud.run( "getItems" );
    user = await Moralis.User.current();
    items.forEach( item => {
        if ( user ) {
            if ( user.attributes.accounts.includes( item.ownerOf ) ) return;
        }
        getAndRenderItemData( item, renderItem );
    } );
}

initTemplate = ( id ) => {
    const template = document.getElementById( id );
    template.id = "";
    template.parentNode.removeChild( template );
    return template;
}

renderUserItem = ( item ) => {
    const userItem = userItemTemplate.cloneNode( true );
    userItem.getElementsByTagName( "img" )[0].src = item.image;
    userItem.getElementsByTagName( "img" )[0].alt = item.name;
    userItem.getElementsByTagName( "h5" )[0].innerText = item.name;
    userItem.getElementsByTagName( "p" )[0].innerText = item.description;
    userItems.appendChild( userItem );
}

renderItem = ( item ) => {
    const itemForSale = marketplaceItemTemplate.cloneNode( true );
    if ( item.avatar ) {
        itemForSale.getElementsByTagName( "img" )[0].src = item.sellerAvatar.url();
        itemForSale.getElementsByTagName( "img" )[0].alt = item.sellerUsername;
    }
    itemForSale.getElementsByTagName( "img" )[1].src = item.image;
    itemForSale.getElementsByTagName( "img" )[1].alt = item.name;
    itemForSale.getElementsByTagName( "h5" )[0].innerText = item.name;
    itemForSale.getElementsByTagName( "p" )[0].innerText = item.description;

    itemForSale.getElementsByTagName( "button" )[0].innerText = `Buy for ${ item.askingPrice }`;
    itemForSale.getElementsByTagName( "button" )[0].onclick = () => buyItem( item );
    itemForSale.id = `item-${ item.uid }`;
    itemsForSale.appendChild( itemForSale );
}


getAndRenderItemData = ( item, renderFunction ) => {
    fetch( item.tokenUri )
        .then( res => res.json() )
        .then( data => {
            item.name = data.name;
            item.description = data.description;
            item.image = data.image;
            renderFunction( item );
        } )

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
        image: nftFilePath
    };

    const nftFileMetadataFile = new Moralis.File( "metadata.json", { base64: btoa( JSON.stringify( metadata ) ) } );
    await nftFileMetadataFile.saveIPFS();

    const nftFileMetadataFilePath = nftFileMetadataFile.ipfs();
    const nftFileMetadataFileHash = nftFileMetadataFile.hash();

    const nftId = await mintNft( nftFileMetadataFilePath );

    // Simple syntax to create a new subclass of Moralis.Object.
    const Item = Moralis.Object.extend( "Item" );
    // Create a new instance of that class.
    const item = new Item();

    item.set( 'name', createItemNameField.value );
    item.set( 'description', createItemDescriptionField.value );
    item.set( 'nftFilePath', nftFilePath );
    item.set( 'nftFileHash', nftFileHash );
    item.set( 'metadataFilePath', nftFileMetadataFilePath );
    item.set( 'metadataFileHash', nftFileMetadataFileHash );
    item.set( 'nftId', nftId );
    item.set( 'nftContractAddress', TOKEN_CONTRACT_ADDRESS );
    await item.save();
    console.log( item );
    user = await Moralis.User.current();
    const userAddress = user.get( 'ethAddress' );
    switch ( createItemStatusField.value ) {
        case "0":
            return;
        case "1":
            await ensureMarketplaceIsApproved( nftId, TOKEN_CONTRACT_ADDRESS );
            await marketplaceContract.methods.addItemToMarket( nftId, TOKEN_CONTRACT_ADDRESS, createItemPriceField.value ).send( { from: userAddress } );
            break;
        case "2":
            alert( "Not yet supported!" );
            return;
    }
}

mintNft = async ( metadataUrl ) => {
    const receipt = await tokenContract.methods.createItem( metadataUrl ).send( { from: ethereum.selectedAddress } );
    console.log( receipt );
    return receipt.events.Transfer.returnValues.tokenId;
}

openUserItems = async () => {
    user = await Moralis.User.current();
    if ( user ) {
        showElement( userItemSection );
    } else {
        login();
    }
}

ensureMarketplaceIsApproved = async ( tokenId, tokenAddress ) => {
    user = await Moralis.User.current();
    const userAddress = user.get( 'ethAddress' );
    const contract = new web3.eth.Contract( tokenContractABI, tokenAddress );
    const approvedAddress = await contract.methods.getApproved( tokenId ).call( { from: userAddress } );
    if ( approvedAddress != MARKET_CONTRACT_ADDRESS ) {
        await contract.methods.approve( MARKET_CONTRACT_ADDRESS, tokenId ).send( { from: userAddress } );
    }
}

buyItem = async ( item ) => {
    user = await Moralis.User.current();
    if ( !user ) {
        login();
        return;
    }
    await marketplaceContract.methods.buyItem( item.uid ).send( { from: user.get( 'ethAddress' ), value: item.askingPrice } );
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


document.getElementById( "btnCloseCreateItem" ).onclick = () => hideElement( createItemForm );
document.getElementById( "btnCreateItem" ).onclick = createItem;

// User Items

const userItemSection = document.getElementById( "userItems" );
const userItems = document.getElementById( "userItemsList" );
document.getElementById( "btnCloseUserItems" ).onclick = () => hideElement( userItemSection );
const openUserItemsButton = document.getElementById( "btnMyItems" );
openUserItemsButton.onclick = openUserItems;

const userItemTemplate = initTemplate( "itemTemplate" );
const marketplaceItemTemplate = initTemplate( "marketplaceItemTemplate" );

// Items For Sale
const itemsForSale = document.getElementById( "itemsForSale" );

init();