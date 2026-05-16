
async function testUpdate() {
    const baseUrl = 'http://localhost:8080/api'; 
    
    // List branches to get an ID
    const listRes = await fetch(`${baseUrl}/branches`);
    const branches = await listRes.json();
    
    if (!branches || branches.length === 0) {
        console.log("No branches found.");
        return;
    }
    
    const branchId = branches[0].id;
    console.log(`Testing update for branch ID: ${branchId}`);
    
    const updateRes = await fetch(`${baseUrl}/branches/${branchId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            name: "Updated Branch Name",
            city: "Lahore",
            address: "Test Address",
            phone: "03001234567"
        })
    });
    
    const data = await updateRes.json();
    console.log(`Status: ${updateRes.status}`);
    console.log(`Response:`, JSON.stringify(data, null, 2));
}

testUpdate();
