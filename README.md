# Minimilitia on Web3
module kaboomers::CharacterNFT {

    use sui::object::{Self, UID};
    use sui::tx_context::{Self, TxContext};
    use sui::transfer;
    use sui::event;

    /// Struct for the player character NFT
    struct CharacterNFT has key, store {
        id: UID,
        name: String,
        level: u64,
    }

    /// Event when a character is minted
    struct CharacterMinted has copy, drop {
        owner: address,
        name: String,
    }

    /// Mint on first login
    public entry fun mint_character(
        name: String,
        ctx: &mut TxContext
    ) {
        let nft = CharacterNFT {
            id: object::new(ctx),
            name,
            level: 1,
        };
        let recipient = tx_context::sender(ctx);
        event::emit(CharacterMinted { owner: recipient, name });
        transfer::transfer(nft, recipient);
    }
}
