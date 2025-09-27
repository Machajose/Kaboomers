module 0x0::RewardToken {
 
    use sui::event;
    use sui::table::{Self, Table};

    /// Error codes
    const E_INSUFFICIENT_BALANCE: u64 = 0;
    const E_UNAUTHORIZED: u64 = 1;

    /// Capabilities for minting tokens
    public struct RewardTokenCap has key {
        id: UID,
    }

    public struct TokenReward has copy, drop {
        player: address,
        amount: u64,
        match_id: u64,
    }

    public struct TokenTransfer has copy, drop {
        from: address,
        to: address,
        amount: u64,
    }

    /// Token registry to track balances
    public struct TokenRegistry has key {
        id: UID,
        balances: Table<address, u64>,
        total_supply: u64,
    }

    /// Initialize the reward token system
    fun init(ctx: &mut TxContext) {
        let token_cap = RewardTokenCap {
            id: object::new(ctx),
        };
        
        let registry = TokenRegistry {
            id: object::new(ctx),
            balances: table::new(ctx),
            total_supply: 0,
        };
        
        transfer::transfer(token_cap, tx_context::sender(ctx));
        transfer::share_object(registry);
    }

    /// Mint reward tokens to a player
    public fun mint_reward(
        _cap: &RewardTokenCap,
        registry: &mut TokenRegistry,
        player: address,
        amount: u64,
        match_id: u64,
    ) {
        // Update player balance
        let current_balance = if (table::contains(&registry.balances, player)) {
            *table::borrow(&registry.balances, player)
        } else {
            0
        };
        
        let new_balance = current_balance + amount;
        
        if (table::contains(&registry.balances, player)) {
            let balance_ref = table::borrow_mut(&mut registry.balances, player);
            *balance_ref = new_balance;
        } else {
            table::add(&mut registry.balances, player, new_balance);
        };
        
        registry.total_supply = registry.total_supply + amount;

        event::emit(TokenReward {
            player,
            amount,
            match_id,
        });
    }

    /// Get total tokens owned by a player
    public fun get_token_balance(registry: &TokenRegistry, player: address): u64 {
        if (table::contains(&registry.balances, player)) {
            *table::borrow(&registry.balances, player)
        } else {
            0
        }
    }

    /// Get total supply of tokens
    public fun get_total_supply(registry: &TokenRegistry): u64 {
        registry.total_supply
    }

    /// Transfer tokens between players (requires sender authorization)
    public fun transfer_tokens(
        registry: &mut TokenRegistry,
        from: address,
        to: address,
        amount: u64,
        ctx: &TxContext,
    ) {
        // Only the token owner can transfer their tokens
        assert!(tx_context::sender(ctx) == from, E_UNAUTHORIZED);
        
        let from_balance = if (table::contains(&registry.balances, from)) {
            *table::borrow(&registry.balances, from)
        } else {
            0
        };
        
        assert!(from_balance >= amount, E_INSUFFICIENT_BALANCE);
        
        let to_balance = if (table::contains(&registry.balances, to)) {
            *table::borrow(&registry.balances, to)
        } else {
            0
        };
        
        // Update balances
        if (table::contains(&registry.balances, from)) {
            let from_ref = table::borrow_mut(&mut registry.balances, from);
            *from_ref = from_balance - amount;
        };
        
        if (table::contains(&registry.balances, to)) {
            let to_ref = table::borrow_mut(&mut registry.balances, to);
            *to_ref = to_balance + amount;
        } else {
            table::add(&mut registry.balances, to, to_balance + amount);
        };

        event::emit(TokenTransfer {
            from,
            to,
            amount,
        });
    }

    /// Burn tokens from a player's balance (only by cap holder)
    public fun burn_tokens(
        _cap: &RewardTokenCap,
        registry: &mut TokenRegistry,
        player: address,
        amount: u64,
    ) {
        let current_balance = if (table::contains(&registry.balances, player)) {
            *table::borrow(&registry.balances, player)
        } else {
            0
        };
        
        assert!(current_balance >= amount, E_INSUFFICIENT_BALANCE);
        
        let balance_ref = table::borrow_mut(&mut registry.balances, player);
        *balance_ref = current_balance - amount;
        registry.total_supply = registry.total_supply - amount;
    }
}

#[test_only]
module reward_token::test {
    use reward_token::RewardToken;
    use sui::test_scenario;

    #[test]
    public fun test_token_minting() {
        let admin = @0xA;
        let player = @0xB;
        
        let scenario_val = test_scenario::begin(admin);
        let scenario = &mut scenario_val;
        
        test_scenario::next_tx(scenario, admin);
        {
            RewardToken::init(test_scenario::ctx(scenario));
        };
        
        test_scenario::next_tx(scenario, admin);
        {
            let cap = test_scenario::take_from_sender<RewardToken::RewardTokenCap>(scenario);
            let registry = test_scenario::take_shared<RewardToken::TokenRegistry>(scenario);
            
            RewardToken::mint_reward(
                &cap,
                &mut registry,
                player,
                100,
                1
            );
            
            let balance = RewardToken::get_token_balance(&registry, player);
            assert!(balance == 100, 0);
            
            let total_supply = RewardToken::get_total_supply(&registry);
            assert!(total_supply == 100, 1);
            
            test_scenario::return_to_sender(scenario, cap);
            test_scenario::return_shared(registry);
        };
        
        test_scenario::end(scenario_val);
    }

    #[test]
    public fun test_token_transfer() {
        let admin = @0xA;
        let player1 = @0xB;
        let player2 = @0xC;
        
        let scenario_val = test_scenario::begin(admin);
        let scenario = &mut scenario_val;
        
        test_scenario::next_tx(scenario, admin);
        {
            RewardToken::init(test_scenario::ctx(scenario));
        };
        
        test_scenario::next_tx(scenario, admin);
        {
            let cap = test_scenario::take_from_sender<RewardToken::RewardTokenCap>(scenario);
            let registry = test_scenario::take_shared<RewardToken::TokenRegistry>(scenario);
            
            RewardToken::mint_reward(
                &cap,
                &mut registry,
                player1,
                100,
                1
            );
            
            test_scenario::return_to_sender(scenario, cap);
            test_scenario::return_shared(registry);
        };
        
        test_scenario::next_tx(scenario, player1);
        {
            let registry = test_scenario::take_shared<RewardToken::TokenRegistry>(scenario);
            
            RewardToken::transfer_tokens(
                &mut registry,
                player1,
                player2,
                50,
                test_scenario::ctx(scenario)
            );
            
            let balance1 = RewardToken::get_token_balance(&registry, player1);
            let balance2 = RewardToken::get_token_balance(&registry, player2);
            
            assert!(balance1 == 50, 0);
            assert!(balance2 == 50, 1);
            
            test_scenario::return_shared(registry);
        };
        
        test_scenario::end(scenario_val);
    }
}