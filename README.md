# Order Statistic Tree implementation in the Ethereum Solidity Language

## Rationale
Most smart contracts in the ethereum smart contract system will probably involve products and/or users. In many instances, it may be necessary for the contract to rank these products or users to make a decision. This is particularly important for contracts involving a reputation or auction algorithm [1].

Common ranking statistics include:

 - Determining percentile of a value
 - Determining membership in the "top n" for a value
 - Determining the rank order of a value
 - Determining the median
 - Determining a value in a certain position in the ordered dataset.

The naïve algorithm for ranking data involves sorting the entire list of values and determining position in this list. However, in the ethereum system this is not viable for several reasons:

 1. Sorting a list repeatedly as values are inserted/removed is inefficient, and would be extremely costly in terms of an ethereum gas price for execution.
 2. Blocks in ethereum have a fixed gas limit. Therefore, if a "global" operation needs to be performed in a single transaction, such as occassionally sorting all products/users on some metric, it may simply be impossible to perform this transaction after a certain number of products/users is reached by a contract... your dapp would break if it became too popular.

Therefore, it is necessary to implement a data structure in an ethereum contract that maintains a sorted set of values at all times, even as new values are inserted/removed. For this contract, we achieve this by implementing an [Order Statistic Tree](http://en.wikipedia.org/wiki/Order_statistic_tree) with a balanced tree structure via the [AVL method](http://en.wikipedia.org/wiki/AVL_tree). Using this data structure, the OrderStatisticTree contract can offer O(logn) inserts, removals, percentiles, topn, and rank order determination [2] [3].

## Running this contract on go-ethereum

To try this contract via go-ethereum, simply:

1. Host the files in this repo on a web server on your local machine
2. Run the go ethereum CLI client on localhost:8080 with the "-rpc" flag enabled (or modify ost_test.js to use a different JSON-RPC endpoint.) Make sure you have some ether currency before continuing with the following steps. [3]
3. Launch "ost_test.html" in Google Chrome.
4. Press "publish contract" to publish the OST contract _(Note: This will publish a binary version of the contract, already compiled- At this time, go-ethereum does not yet contain support for compiling the solidity language. See steps below for separate compilation.)_
5. Wait 12 seconds or more for a block to be mined _(In the future, I'll modify the contract to wait automatically.)_
6. Press either "Run tests" to run programmer-created tests, or "Run generative tests" to run algorithmically generated tests designed to deeply exercise the tree balancing algorithms.

Here is what the output should look like after clicking "Run Tests" button (see lower right panel): http://jsfiddle.net/zwxsqcr0/1/

At this point, you should see output in the browser UI exercising functions in the contract, showing outputs and test results, as well as showing store information extracted from the contract for debugging [4].

## Disclaimer

This contract has been heavily tested with random scripts, however ethereum is an extremely alpha project right now and the OST is extremely alpha as well, and almost certainly contains bugs. I can take no responsibility if anything bad happens to you if you use this contract. Also, be aware that **in actual use you MUST implement "gatekeeper" code of some sort in the mutating public functions of the contract, or any random ethereum user can modify data in the contract at will.** [5]

## Documentation of Public Contract Functions

 - **insert(uint value)**: Places a new value into the tree. _Duplicates are permitted_.
 - **remove(uint value)**: Removes a value, if it exists. _Only removes a single value if there are duplicates_.
 - **rank(uint value)**: Returns the position of the item in the list, if items were sorted from smallest to largest.
 - **select_at(uint pos)**: Returns the value at the given location in the dataset, ranked from lowest to highest.
 - **duplicates(uint value)**: Returns how many instances of this value are currently stored.
 - **count()**: Returns the total count of values in the tree.
 - **in_top_n(uint value,uint n)**: Indicates whether the given item is in the top n values in the tree (only true for duplicates if all members are in the "top n".)
 - **percentile(uint value)**: Returns the percentile of the value in the tree.
 - **at_percentile(uint percentile)**: Returns the value at the given percentile.
 - **permille(uint value)**: Returns the permille of the value in the tree. (This is like percentile, just with thousands instead of hundreds.)
 - **at_pemille(uint permille)**: Returns the value at the given permille.
 - **median()**: Returns the median of all values. (Returns the higher value if there are an even number of values.)
 - **node_?(uint value)**: These are various low-level debugging functions that will likely be removed in future versions of this contract.

## Compiling the Contract

This contract was compiled using cpp-ethereum/solc, using the flags "solc OrderStatisticTree.sol --json-abi file --binary file".

## Footnotes

[1]: There is already a [heap implementation](https://github.com/ethereum/serpent/blob/master/examples/cyberdyne/heap.se) available in the ethereum serpent dialect that can be used for many auction types. However, other auction algorithms require an order statistic tree or similar structure for efficient implementation.

[2]: Note that the underlying data structure algos in ethereum already carry an O(logn^2) limitation, so technically speaking this OST contract has O(logn^3) performance characteristics. (Read articles from [the official ethereum blog](http://blog.ethereum.org) for details on ethereum performance on this subject and others.

[3]: Go ethereum is currently under heavy development. If you are reading this in early 2015 you may want to review some [important information here](http://forum.ethereum.org/discussion/1784/my-working-steps-go-ethereum-cli-json-rpc-chrome-browser-etherum-js-solidity) regarding the go-ethereum JSON-RPC interface to get things working.

[4]: My implementation for showing debugging output is inefficient and the main reason for the slowness in running the tests- This would not be an issue in actual use.

[5]: Currently the only mutating public functions in this contract are *insert()* and *remove()*.

## Copyright & License

Licensed under GNU GENERAL PUBLIC LICENSE Version 3

Copyright © 2015 Conrad Barski