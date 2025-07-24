# Example Xian contract to test the extension
# This file contains intentional errors to demonstrate the linter

# ❌ Prohibited import
import os

# State variables
balances = Hash(default_value=0)
total_supply = Variable()

# ❌ Function with _ prefix (not allowed)
def _private_function():
    pass

# ❌ Function without @export
def helper_function():
    return "helper"

# ✅ Correct construct function
@construct
def seed():
    total_supply.set(1000000)
    balances[ctx.caller] = total_supply.get()

# ❌ Function with issues
@export
def transfer(to: str, amount: float):
    # ❌ Assert without message
    assert amount > 0
    
    # ❌ Operation without balance validation
    balances[ctx.caller] = balances[ctx.caller] - amount
    balances[to] = balances[to] + amount
    
    # ❌ Use of print (not available)
    print(f"Transferred {amount} to {to}")

# ✅ Correct function
@export
def balance_of(account: str) -> float:
    assert account, "Account cannot be empty"
    return balances[account]

# ❌ Use of ctx.signer for authorization (should be ctx.caller)
@export
def admin_function():
    assert ctx.signer == "admin", "Only admin"
    # Admin logic

# ❌ Try/except not allowed
@export
def risky_function():
    try:
        result = 10 / 0
        return result
    except:
        return 0