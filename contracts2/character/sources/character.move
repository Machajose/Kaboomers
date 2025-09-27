module 0x0::Character {
    use std::string::String;
    use sui::table::Table;

    public struct CharacterNFT has key, store {
        id: UID,
        player_id: address,
        character_name: String,
        level: u64,
        created_at: u64,
    }

    public struct CharacterNFTCap has key {
        id: UID,
        nft_id: ID,
    }

    public struct NFTMinted has copy, drop {
        player: address,
        nft_id: ID,
        character_name: String,
    }

    // Store to track which players have NFTs
    public struct NFTRegistry has key {
        id: UID,
        player_nfts: Table<address, ID>,
    }

    // Internal init function
    fun init(ctx: &mut TxContext) {
        let registry = NFTRegistry {
            id: sui::object::new(ctx),
            player_nfts: sui::table::new(ctx),
        };
        sui::transfer::share_object(registry);
    }

    // Mint a new Character NFT for a player
    #[allow(lint(self_transfer))]
    public fun mint_nft(
        registry: &mut NFTRegistry,
        character_name: String,
        ctx: &mut TxContext,
    ) {
        let player_id = sui::tx_context::sender(ctx);
        
        // Check if player already has an NFT
        assert!(!sui::table::contains(&registry.player_nfts, player_id), 0);

        let nft = CharacterNFT {
            id: sui::object::new(ctx),
            player_id,
            character_name,
            level: 1,
            created_at: sui::tx_context::epoch(ctx),
        };

        let nft_id = sui::object::uid_to_inner(&nft.id);
        let cap = CharacterNFTCap {
            id: sui::object::new(ctx),
            nft_id,
        };

        sui::transfer::transfer(nft, player_id);
        sui::transfer::transfer(cap, player_id);

        // Record in registry
        sui::table::add(&mut registry.player_nfts, player_id, nft_id);

        sui::event::emit(NFTMinted {
            player: player_id,
            nft_id,
            character_name,
        });
    }

    // Level up the character NFT
    public fun level_up(nft: &mut CharacterNFT, _cap: &CharacterNFTCap) {
        nft.level = nft.level + 1;
    }

    // Get player's NFT info
    public fun get_character_info(nft: &CharacterNFT): (address, String, u64, u64) {
        (nft.player_id, nft.character_name, nft.level, nft.created_at)
    }

    // Get character level
    public fun get_level(nft: &CharacterNFT): u64 {
        nft.level
    }

    // Get character name
    public fun get_name(nft: &CharacterNFT): String {
        nft.character_name
    }

    // Check if player already has an NFT
    public fun has_character_nft(registry: &NFTRegistry, player: address): bool {
        sui::table::contains(&registry.player_nfts, player)
    }

    // Get player's NFT ID
    public fun get_player_nft_id(registry: &NFTRegistry, player: address): ID {
        *sui::table::borrow(&registry.player_nfts, player)
    }
}

/* #[test_only]
module 0x0::character_nft_test {
    use 0x0::CharacterNFT;
    use sui::test_scenario;
    use std::string;

    #[test]
    public fun test_mint_nft() {
        let admin = @0xA;
        let player = @0xB;
        
        let scenario_val = test_scenario::begin(admin);
        let scenario = &mut scenario_val;
        
        test_scenario::next_tx(scenario, admin);
        {
            CharacterNFT::init(test_scenario::ctx(scenario));
        };
        
        test_scenario::next_tx(scenario, player);
        {
            let registry = test_scenario::take_shared<CharacterNFT::NFTRegistry>(scenario);
            let character_name = string::utf8(b"Test Hero");
            
            CharacterNFT::mint_nft(
                &mut registry,
                character_name,
                test_scenario::ctx(scenario)
            );
            
            assert!(CharacterNFT::has_character_nft(&registry, player), 0);
            
            test_scenario::return_shared(registry);
        };
        
        test_scenario::next_tx(scenario, player);
        {
            let nft = test_scenario::take_from_sender<CharacterNFT::CharacterNFT>(scenario);
            let (owner, name, level, _created_at) = CharacterNFT::get_character_info(&nft);
            
            assert!(owner == player, 1);
            assert!(level == 1, 2);
            assert!(name == string::utf8(b"Test Hero"), 3);
            
            test_scenario::return_to_sender(scenario, nft);
        };
        
        test_scenario::end(scenario_val);
    }
}


/// Module: character
module character::character;
*/

// For Move coding conventions, see
// https://docs.sui.io/concepts/sui-move-concepts/conventions


