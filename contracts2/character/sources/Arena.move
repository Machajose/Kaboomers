module 0x0::Arena{
    use sui::event;
    use sui::table::{Self, Table};
    

    public struct MatchResult has store,copy {
        winner: address,
        match_id: u64,
        timestamp: u64,
        participants: vector<address>,
        rewards_distributed: bool,
    }

    public struct ArenaRegistry has key {
        id: UID,
        next_match_id: u64,
        total_matches: u64,
        match_results: Table<u64, MatchResult>,
    }

    public struct MatchRecorded has copy, drop {
        match_id: u64,
        winner: address,
        participants: vector<address>,
    }

    /// Initialize the arena registry
    fun init(ctx: &mut TxContext) {
        let registry = ArenaRegistry {
            id: object::new(ctx),
            next_match_id: 0,
            total_matches: 0,
            match_results: table::new(ctx),
        };
        
        transfer::share_object(registry);
    }

    /// Record match result
    public fun record_match_result(
        registry: &mut ArenaRegistry,
        winner: address,
        participants: vector<address>,
        ctx: &mut TxContext,
    ): u64 {
        let match_id = registry.next_match_id;
        registry.next_match_id = match_id + 1;
        registry.total_matches = registry.total_matches + 1;

        let match_result = MatchResult {
            winner,
            match_id,
            timestamp: tx_context::epoch_timestamp_ms(ctx),
            participants,
            rewards_distributed: false,
        };

        table::add(&mut registry.match_results, match_id, match_result);

        event::emit(MatchRecorded {
            match_id,
            winner,
            participants,
        });

        match_id
    }

    /// Get match result by ID
    public fun get_match_result(registry: &ArenaRegistry, match_id: u64): Option<MatchResult> {
        if (table::contains(&registry.match_results, match_id)) {
            option::some(*table::borrow(&registry.match_results, match_id))
        } else {
            option::none()
        }
    }

    /// Mark rewards as distributed for a match
    public fun mark_rewards_distributed(registry: &mut ArenaRegistry, match_id: u64) {
        if (table::contains(&registry.match_results, match_id)) {
            let match_result = table::borrow_mut(&mut registry.match_results, match_id);
            match_result.rewards_distributed = true;
        }
    }

    /// Get current match count
    public fun get_match_count(registry: &ArenaRegistry): u64 {
        registry.total_matches
    }

    /// Get next match ID
    public fun get_next_match_id(registry: &ArenaRegistry): u64 {
        registry.next_match_id
    }
}
