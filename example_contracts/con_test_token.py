# Example Xian Token Contract for Testing Deployment
# This is a simple token contract that can be deployed using the extension

# State variables
balances = Hash(default_value=0)
total_supply = Variable()
metadata = Hash()

@construct
def seed():
    # Initialize the token with basic metadata
    metadata['token_name'] = 'Test Token'
    metadata['token_symbol'] = 'TEST'
    metadata['operator'] = ctx.caller
    
    # Set initial supply
    initial_supply = 1000000
    total_supply.set(initial_supply)
    balances[ctx.caller] = initial_supply

@export
def transfer(to: str, amount: float):
    """Transfer tokens from caller to another address"""
    assert amount > 0, "Amount must be positive"
    assert balances[ctx.caller] >= amount, "Insufficient balance"
    
    balances[ctx.caller] -= amount
    balances[to] += amount
    
    return f"Transferred {amount} tokens to {to}"

@export
def balance_of(account: str) -> float:
    """Get balance of an account"""
    assert account, "Account cannot be empty"
    return balances[account]

@export
def get_total_supply() -> float:
    """Get total token supply"""
    return total_supply.get()

@export
def get_metadata(key: str) -> str:
    """Get token metadata"""
    return metadata[key]

@export
def mint(to: str, amount: float):
    """Mint new tokens (only operator)"""
    assert ctx.caller == metadata['operator'], "Only operator can mint"
    assert amount > 0, "Amount must be positive"
    
    balances[to] += amount
    total_supply.set(total_supply.get() + amount)
    
    return f"Minted {amount} tokens to {to}"

@export
def burn(amount: float):
    """Burn tokens from caller's balance"""
    assert amount > 0, "Amount must be positive"
    assert balances[ctx.caller] >= amount, "Insufficient balance"
    
    balances[ctx.caller] -= amount
    total_supply.set(total_supply.get() - amount)
    
    return f"Burned {amount} tokens"
