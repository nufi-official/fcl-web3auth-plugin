import {web3AuthNetworkToCadenceContractAddresses} from './constants'

type NetworkContractAddresses =
  (typeof web3AuthNetworkToCadenceContractAddresses)[keyof typeof web3AuthNetworkToCadenceContractAddresses]

export const getLinkAccountCadence = ({
  NonFungibleToken,
  MetadataViews,
  LinkedAccountMetadataViews,
  LinkedAccounts,
}: NetworkContractAddresses) => `
#allowAccountLinking

import MetadataViews from ${MetadataViews}
import NonFungibleToken from ${NonFungibleToken}
import LinkedAccountMetadataViews from ${LinkedAccountMetadataViews}
import LinkedAccounts from ${LinkedAccounts}

/// Signing account claims a Capability to specified Address's AuthAccount
/// and adds it as a child account in its LinkedAccounts.Collection, allowing it 
/// to maintain the claimed Capability


transaction(
        linkedAccountAddress: Address,
        linkedAccountName: String,
        linkedAccountDescription: String,
        clientThumbnailURL: String,
        clientExternalURL: String,
        handlerPathSuffix: String
    ) {

    let collectionRef: &LinkedAccounts.Collection
    let info: LinkedAccountMetadataViews.AccountInfo
    let authAccountCap: Capability<&AuthAccount>

    prepare(signer: AuthAccount) {
        /** --- Configure Collection & get ref --- */
        //
        // Check that Collection is saved in storage
        if signer.type(at: LinkedAccounts.CollectionStoragePath) == nil {
            signer.save(
                <-LinkedAccounts.createEmptyCollection(),
                to: LinkedAccounts.CollectionStoragePath
            )
        }
        // Link the public Capability
        if !signer.getCapability<
                &LinkedAccounts.Collection{NonFungibleToken.Receiver, NonFungibleToken.CollectionPublic, LinkedAccounts.CollectionPublic, MetadataViews.ResolverCollection}
            >(LinkedAccounts.CollectionPublicPath).check() {
            signer.unlink(LinkedAccounts.CollectionPublicPath)
            signer.link<&LinkedAccounts.Collection{NonFungibleToken.Receiver, NonFungibleToken.CollectionPublic, LinkedAccounts.CollectionPublic, MetadataViews.ResolverCollection}>(
                LinkedAccounts.CollectionPublicPath,
                target: LinkedAccounts.CollectionStoragePath
            )
        }
        // Link the private Capability
        if !signer.getCapability<
                &LinkedAccounts.Collection{NonFungibleToken.Provider, NonFungibleToken.CollectionPublic, LinkedAccounts.CollectionPublic, MetadataViews.ResolverCollection}
            >(LinkedAccounts.CollectionPrivatePath).check() {
            signer.unlink(LinkedAccounts.CollectionPrivatePath)
            signer.link<
                &LinkedAccounts.Collection{NonFungibleToken.Provider, NonFungibleToken.CollectionPublic, LinkedAccounts.CollectionPublic, MetadataViews.ResolverCollection}
            >(
                LinkedAccounts.CollectionPrivatePath,
                target: LinkedAccounts.CollectionStoragePath
            )
        }
        // Get Collection reference from signer
        self.collectionRef = signer.borrow<&LinkedAccounts.Collection>(
                from: LinkedAccounts.CollectionStoragePath
            )!
        
        /** --- Prep to link account --- */
        //
        // Claim the previously published AuthAccount Capability from the given Address
        self.authAccountCap = signer.inbox.claim<&AuthAccount>(
                "AuthAccountCapability",
                provider: linkedAccountAddress
            ) ?? panic(
                "No AuthAccount Capability available from given provider"
                .concat(linkedAccountAddress.toString())
                .concat(" with name ")
                .concat("AuthAccountCapability")
            )
        
        /** --- Construct metadata --- */
        //
        // Construct linked account metadata from given arguments
        self.info = LinkedAccountMetadataViews.AccountInfo(
            name: linkedAccountName,
            description: linkedAccountDescription,
            thumbnail: MetadataViews.HTTPFile(url: clientThumbnailURL),
            externalURL: MetadataViews.ExternalURL(clientExternalURL)
        )
    }

    execute {
        // Add account as child to the signer's LinkedAccounts.Collection
        self.collectionRef.addAsChildAccount(
            linkedAccountCap: self.authAccountCap,
            linkedAccountMetadata: self.info,
            linkedAccountMetadataResolver: nil,
            handlerPathSuffix: handlerPathSuffix
        )
    }
}
`

export const publishAccountCadence = `
#allowAccountLinking

/// Signing account publishes a Capability to its AuthAccount for
/// the specified parentAddress to claim
///
transaction(parentAddress: Address, authAccountPathSuffix: String) {

    let authAccountCap: Capability<&AuthAccount>

    prepare(signer: AuthAccount) {
        // Assign the PrivatePath where we'll link the AuthAccount Capability
        let authAccountPath: PrivatePath = PrivatePath(identifier: authAccountPathSuffix)
            ?? panic("Could not construct PrivatePath from given suffix: ".concat(authAccountPathSuffix))
        // Get the AuthAccount Capability, linking if necessary
        if !signer.getCapability<&AuthAccount>(authAccountPath).check() {
            signer.unlink(authAccountPath)
            self.authAccountCap = signer.linkAccount(authAccountPath)!
        } else {
            self.authAccountCap = signer.getCapability<&AuthAccount>(authAccountPath)
        }
        // Publish for the specified Address
        signer.inbox.publish(self.authAccountCap!, name: "AuthAccountCapability", recipient: parentAddress)
    }
}
`
