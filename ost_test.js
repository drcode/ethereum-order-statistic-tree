/*
    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.

    Copyright 2015 Conrad Barski

*/

var contract;
var contract_address;
var contract_abi;
var contract_hex;
var cycle=false;

var web3 = require('web3');
web3.setProvider(new web3.providers.HttpSyncProvider('http://localhost:8080'));

function cleanup_hex(s){
    return '0x'+s.replace(/\n/g, "");
}

function load_contract_hex(){
    $.getJSON(
        'OrderStatisticTree.abi',
        function(abi){
            contract_abi=abi;
        })
}

function load_contract_abi(){
    $.get(
        'OrderStatisticTree.binary',
        function(hex){
            contract_hex=cleanup_hex(hex);
        })
}

function publish_contract(){
    contract_address=web3.eth.transact({data:contract_hex,gas:"50000",gasprice:"50"});
    $('#address').text('Contract address : '+contract_address);
    contract=web3.eth.contract(contract_address,contract_abi);
    $('#test').show();
    $('#generative_test').show();
    $('#test_table').show();
    $('#publish').prop('disabled',true);
}

function store(value,visited){
    if (visited[value]){
        alert('Cycle in tree :(');
        cycle=true;
    }
    visited[value]=true;
    var side="left";
    if (contract.call().node_side(value).toString()=="true")
        side="right"
    var result={
        value:value,
        dupes:parseInt(contract.call().node_dupes(value))
    }
    if (value!=0){
        result.side=side;
        result.parent=parseInt(contract.call().node_parent(value));
        result.height=parseInt(contract.call().node_height(value));
        result.count=parseInt(contract.call().node_count(value));
    }
    var left=parseInt(contract.call().node_left_child(value));
    var right=parseInt(contract.call().node_right_child(value));
    if (left!=0 && !cycle)
        result.left=store(left,visited);
    if (right!=0 && !cycle)
        result.right=store(right,visited);
    return result;
}

var tests=
    [
        [
            'insert',
            [5],
            null
        ],
        [
            'percentile',
            [5],
            50
        ],
        [
            'remove',
            [5],
            null
        ],
        [
            'insert',
            [5],
            null
        ],
        [
            'rank',
            [5],
            0
        ],
        [
            'insert',
            [0],
            null
        ],
        [
            'rank',
            [5],
            1
        ],
        [
            'insert',
            [6],
            null
        ],
        [
            'insert',
            [7],
            null
        ],
        [
            'count',
            [],
            4
        ],
        [
            'percentile',
            [6],
            62
        ],
        [
            'insert',
            [5],
            null
        ],
        [
            'percentile',
            [6],
            70
        ],
        [
            'insert',
            [8],
            null
        ],
        [
            'remove',
            [5],
            null
        ],
        [
            'remove',
            [5],
            null
        ]
    ]
var xtra_test=null;
        
function rand_int(n){
    return Math.floor(Math.random()*n);
}

var test_depth=20;

function generate_tests(){
    if (xtra_test!=null)
        return xtra_test;
    var items=[];
    var arr=[];
    
    var remove=function(){
        var pos=rand_int(items.length);
        arr.push(['remove',[items[pos]],null]);
        items.splice(pos,1);
    }
    for(var i=0;i<test_depth;i++){
        if(Math.random()<0.3 && items.length>0)
            remove();
        else{
            var nu=rand_int(test_depth);
            items.push(nu);
            arr.push(['insert',[nu],null]);
        }
    }
    while(items.length>0)
        remove();
    $('#script').text(JSON.stringify(arr));
    console.log(JSON.stringify(arr,undefined,2));
    return arr;
}

function bad_store(store){
    if(store==null)
        return false;
    var count=1+store.dupes;
    var height_left=0;
    var height_right=0;
    var right=store.right;
    var left=store.left;
    if (right!=null){
        count+=right.count;
        height_right=right.height;
        if(bad_store(right))
            return true;
    }
    if (left!=null){
        count+=left.count;
        height_left=left.height;
        if(bad_store(left))
            return true;
    }
    var height=Math.max(height_left,height_right)+1;
    if (Math.abs(height_left-height_right)>=2 || height!=store.height || count!=store.count)
        return true;
}

function test_contract(generative){
    var corrupt=false;
    var st;
    $('#test_table tr').remove();
    var cur_tests=tests;
    if(generative)
        cur_tests=generate_tests();
    for(var i=0;i<cur_tests.length;i++){
        test=cur_tests[i];
        result=contract.call()[test[0]].apply(this,test[1]);

        status=''
        if(test[2]!=null){
            if(result!=test[2] && result.toString()!=test[2].toString())
                status='<span class="failed" style="color:red">failed</span>';        
            else
                status='<span class="passed" style="color:green">passed</span>';
        }
        cycle=false;
        st=store(0,{});
        $('#test_table').append('<tr style="border: 1px solid black"><td>'+test[0]+'('+test[1]+')</td><td>=</td><td>'+result+'</td><td>'+status+'</td><td><pre>'+JSON.stringify(st,undefined,4)+'</pre></td>');
        if (cycle){
            corrupt=true;
            break;
        }
        if (bad_store(st.right)){
            corrupt=true;
            alert('bad store');
            break;
        }
        
    }
    if(!corrupt && generative){
        if (st.right!=null)
            alert('junk left over');
    }
}

$(function(){
    load_contract_hex();
    load_contract_abi();
})
