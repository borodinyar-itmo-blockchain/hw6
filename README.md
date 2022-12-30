# hw6

## Testing
Set at `.env` file `ALCHEMY_TOKEN` variable to your Alchemy API key. 

Then run `npm inslall` command.

To run tests run `npx hardhat test` command.


## Example output:
```  
  Flashloan
Flashloan deployed to: 0xe044814c9eD1e6442Af956a817c161192cBaE98F
Balance before:  1000000000000000000 WETH
Swap
        Token0: In: 0 WETH
        Token1: In: 1000000000000000000 LINK
        Token0: Out: 213523087465120828065 WETH
        Token1: Out: 0 LINK

Swap
        Token0: In: 213523087465120828065 LINK
        Token1: In: 0 USTD
        Token0: Out: 0 LINK
        Token1: Out: 182705689 USTD

Swap
        Token0: In: 0 USTD
        Token1: In: 182705689 WETH
        Token0: Out: 151917351241776910 USTD
        Token1: Out: 0 WETH

Balance after:  151017351241776910 WETH
Flashloan successful
Flashloan loss:  848982648758223090 WETH
Gas used:  422704
    √ Take a flash loan and make a trnasaction (19772ms)


  1 passing (20s)
```
