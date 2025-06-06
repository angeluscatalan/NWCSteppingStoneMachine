let supplyCount, demandCount;
        let supply = [],
            demand = [],
            costMatrix = [],
            steps = [],
            allocationMatrix = [];
        let stepIndex = 0;
        let screenHistory = ["startScreen"]; // Initialize with the first screen
        let steppingStoneSteps = [];
        let steppingStoneIndex = 0;
        let dummyAdded = false; // Flag to track if dummy row/column has been added
        let totalSupply = 0,
            totalDemand = 0;
        // Store input values to preserve them when navigating back
        let savedInputValues = {};

        function nextScreen(screenId) {
            screenHistory.push(screenId); // Add the current screen to history
            document
                .querySelectorAll(".screen")
                .forEach((s) => s.classList.remove("active"));
            document.getElementById(screenId).classList.add("active");
        }

        function previousScreen() {
            if (screenHistory.length > 1) {
                screenHistory.pop(); // Remove the current screen
                const previousScreenId = screenHistory[screenHistory.length - 1]; // Get the previous screen
                document
                    .querySelectorAll(".screen")
                    .forEach((s) => s.classList.remove("active"));
                document.getElementById(previousScreenId).classList.add("active");
            }
        }

        // Function to go back to dimension screen
        function goBackToDimensionScreen() {
            screenHistory = ["dimensionScreen"];
            document
                .querySelectorAll(".screen")
                .forEach((s) => s.classList.remove("active"));
            document.getElementById("dimensionScreen").classList.add("active");
        }

        // Special function to go back to input matrix from result or stepping stone screens
        function goBackToInputMatrix() {
            // First, save the current dimensions if they're not already saved
            if (!savedInputValues.supplyCount || !savedInputValues.demandCount) {
                savedInputValues.supplyCount = supplyCount;
                savedInputValues.demandCount = demandCount;
            }

            // Reset the screen history to show only the input matrix screen
            screenHistory = ["inputMatrixScreen"];
            document
                .querySelectorAll(".screen")
                .forEach((s) => s.classList.remove("active"));
            document.getElementById("inputMatrixScreen").classList.add("active");

            // Regenerate the input matrix with saved dimensions
            regenerateInputMatrix();

            // Reset the state
            resetState();
        }

        function regenerateInputMatrix() {
            // Get the saved dimensions
            const savedSupplyCount = parseInt(savedInputValues.supplyCount);
            const savedDemandCount = parseInt(savedInputValues.demandCount);

            if (
                !savedSupplyCount ||
                !savedDemandCount ||
                savedSupplyCount < 1 ||
                savedDemandCount < 1
            ) {
                // If no saved dimensions, go back to dimension screen
                nextScreen("dimensionScreen");
                return;
            }

            // Update the current dimensions
            supplyCount = savedSupplyCount;
            demandCount = savedDemandCount;

            // Update the dimension inputs
            document.getElementById("supplyCount").value = supplyCount;
            document.getElementById("demandCount").value = demandCount;

            const table = document.getElementById("inputMatrix");
            table.innerHTML = ""; // Clear any existing table content

            // Create table header
            const header = document.createElement("tr");
            header.innerHTML =
                "<th></th>" +
                Array.from(
                    { length: demandCount },
                    (_, j) => `<th>D${j + 1}</th>`
                ).join("") +
                "<th>SUPPLY</th>";
            table.appendChild(header);

            // Create rows for supply and cost inputs
            for (let i = 0; i < supplyCount; i++) {
                const row = document.createElement("tr");
                row.innerHTML =
                    `<th>S${i + 1}</th>` +
                    Array.from(
                        { length: demandCount },
                        (_, j) =>
                            `<td><input type="number" id="cost${i}_${j}" min="0" /></td>`
                    ).join("") +
                    `<td><input type="number" id="supply${i}" min="0" /></td>`;
                table.appendChild(row);
            }

            // Create row for demand inputs
            const demandRow = document.createElement("tr");
            demandRow.innerHTML =
                "<th>DEMAND</th>" +
                Array.from(
                    { length: demandCount },
                    (_, j) => `<td><input type="number" id="demand${j}" min="0" /></td>`
                ).join("") +
                '<td class="diagonal-cell"><div class="top-value" id="totalSupply"></div><div class="bottom-value" id="totalDemand"></div></td>';
            table.appendChild(demandRow);

            // Restore any previously saved values
            restoreInputValues();

            // Update totals
            updateTotals();
        }

        function updateTotals() {
            let supplyTotal = 0;
            let demandTotal = 0;

            // Calculate total supply
            for (let i = 0; i < supplyCount; i++) {
                const supplyInput = document.getElementById(`supply${i}`);
                if (supplyInput && !isNaN(parseInt(supplyInput.value))) {
                    supplyTotal += parseInt(supplyInput.value);
                }
            }

            // Calculate total demand
            for (let j = 0; j < demandCount; j++) {
                const demandInput = document.getElementById(`demand${j}`);
                if (demandInput && !isNaN(parseInt(demandInput.value))) {
                    demandTotal += parseInt(demandInput.value);
                }
            }

            // Update the total display
            const totalSupplyElement = document.getElementById("totalSupply");
            const totalDemandElement = document.getElementById("totalDemand");

            if (totalSupplyElement && totalDemandElement) {
                totalSupplyElement.textContent = supplyTotal;
                totalDemandElement.textContent = demandTotal;

                // Set color based on equality
                if (supplyTotal === demandTotal) {
                    totalSupplyElement.className = "top-value equal";
                    totalDemandElement.className = "bottom-value equal";
                } else {
                    totalSupplyElement.className = "top-value not-equal";
                    totalDemandElement.className = "bottom-value not-equal";
                }
            }

            // Save the totals
            totalSupply = supplyTotal;
            totalDemand = demandTotal;
        }

        function resetState() {
            // Reset the nextStepButton to its initial state
            const nextStepButton = document.getElementById("nextStepButton");
            if (nextStepButton) {
                nextStepButton.textContent = "Next Step";
                nextStepButton.onclick = showNextStep;
            }

            // Clear steps and reset stepIndex
            steps = [];
            stepIndex = 0;
            dummyAdded = false;

            // Clear the allocation table and step output
            const allocationTable = document.getElementById("allocationTable");
            if (allocationTable) {
                allocationTable.innerHTML = "";
            }

            const stepOutput = document.getElementById("stepOutput");
            if (stepOutput) {
                stepOutput.innerHTML = "";
            }

            // Remove the cost computation table if it exists
            const existingCostComputationDiv =
                document.getElementById("costComputationDiv");
            if (existingCostComputationDiv) {
                existingCostComputationDiv.remove();
            }
        }

        function saveInputValues() {
            // Save supply and demand counts
            savedInputValues.supplyCount =
                document.getElementById("supplyCount").value;
            savedInputValues.demandCount =
                document.getElementById("demandCount").value;

            // Save cost matrix values
            for (let i = 0; i < supplyCount; i++) {
                for (let j = 0; j < demandCount; j++) {
                    const costInput = document.getElementById(`cost${i}_${j}`);
                    if (costInput) {
                        savedInputValues[`cost${i}_${j}`] = costInput.value;
                    }
                }
            }

            // Save supply values
            for (let i = 0; i < supplyCount; i++) {
                const supplyInput = document.getElementById(`supply${i}`);
                if (supplyInput) {
                    savedInputValues[`supply${i}`] = supplyInput.value;
                }
            }

            // Save demand values
            for (let j = 0; j < demandCount; j++) {
                const demandInput = document.getElementById(`demand${j}`);
                if (demandInput) {
                    savedInputValues[`demand${j}`] = demandInput.value;
                }
            }
        }

        function restoreInputValues() {
            // Restore cost matrix values
            for (let i = 0; i < supplyCount; i++) {
                for (let j = 0; j < demandCount; j++) {
                    const costInput = document.getElementById(`cost${i}_${j}`);
                    if (costInput && savedInputValues[`cost${i}_${j}`]) {
                        costInput.value = savedInputValues[`cost${i}_${j}`];
                    }
                }
            }

            // Restore supply values
            for (let i = 0; i < supplyCount; i++) {
                const supplyInput = document.getElementById(`supply${i}`);
                if (supplyInput && savedInputValues[`supply${i}`]) {
                    supplyInput.value = savedInputValues[`supply${i}`];
                }
            }

            // Restore demand values
            for (let j = 0; j < demandCount; j++) {
                const demandInput = document.getElementById(`demand${j}`);
                if (demandInput && savedInputValues[`demand${j}`]) {
                    demandInput.value = savedInputValues[`demand${j}`];
                }
            }
        }

        function generateCombinedMatrix() {
            supplyCount = parseInt(document.getElementById("supplyCount").value);
            demandCount = parseInt(document.getElementById("demandCount").value);

            if (
                !supplyCount ||
                !demandCount ||
                supplyCount < 1 ||
                demandCount < 1
            ) {
                alert("Please enter valid dimensions.");
                return;
            }

            // Save the dimensions
            savedInputValues.supplyCount = supplyCount;
            savedInputValues.demandCount = demandCount;

            const table = document.getElementById("inputMatrix");
            table.innerHTML = ""; // Clear any existing table content

            // Create table header
            const header = document.createElement("tr");
            header.innerHTML =
                "<th></th>" +
                Array.from(
                    { length: demandCount },
                    (_, j) => `<th>D${j + 1}</th>`
                ).join("") +
                "<th>SUPPLY</th>";
            table.appendChild(header);

            // Create rows for supply and cost inputs
            for (let i = 0; i < supplyCount; i++) {
                const row = document.createElement("tr");
                row.innerHTML =
                    `<th>S${i + 1}</th>` +
                    Array.from(
                        { length: demandCount },
                        (_, j) =>
                            `<td><input type="number" id="cost${i}_${j}" min="0" /></td>`
                    ).join("") +
                    `<td><input type="number" id="supply${i}" min="0" onchange="updateTotals()" /></td>`;
                table.appendChild(row);
            }

            // Create row for demand inputs
            const demandRow = document.createElement("tr");
            demandRow.innerHTML =
                "<th>DEMAND</th>" +
                Array.from(
                    { length: demandCount },
                    (_, j) =>
                        `<td><input type="number" id="demand${j}" min="0" onchange="updateTotals()" /></td>`
                ).join("") +
                '<td class="diagonal-cell"><div class="top-value" id="totalSupply">0</div><div class="bottom-value" id="totalDemand">0</div></td>';
            table.appendChild(demandRow);

            // Restore any previously saved values
            restoreInputValues();

            // Update totals
            updateTotals();

            // Switch to the input matrix screen
            nextScreen("inputMatrixScreen");
        }

        function solveWithNorthwestCorner() {
            // Save input values before processing
            saveInputValues();

            // Check if all inputs exist before trying to read them
            const allInputsExist = checkAllInputsExist();
            if (!allInputsExist) {
                alert(
                    "Some input fields are missing. Please regenerate the input table."
                );
                return;
            }

            supply = [];
            demand = [];

            // Read supply values
            for (let i = 0; i < supplyCount; i++) {
                const supplyInput = document.getElementById(`supply${i}`);
                if (supplyInput) {
                    supply.push(parseInt(supplyInput.value));
                } else {
                    alert(`Supply input for S${i + 1} is missing.`);
                    return;
                }
            }

            // Read demand values
            for (let j = 0; j < demandCount; j++) {
                const demandInput = document.getElementById(`demand${j}`);
                if (demandInput) {
                    demand.push(parseInt(demandInput.value));
                } else {
                    alert(`Demand input for D${j + 1} is missing.`);
                    return;
                }
            }

            if (supply.includes(NaN) || demand.includes(NaN)) {
                alert("Please fill in all supply and demand values.");
                return;
            }

            costMatrix = [];
            // Read cost matrix values
            for (let i = 0; i < supplyCount; i++) {
                const row = [];
                for (let j = 0; j < demandCount; j++) {
                    const costInput = document.getElementById(`cost${i}_${j}`);
                    if (costInput) {
                        row.push(parseInt(costInput.value));
                    } else {
                        alert(`Cost input for S${i + 1}-D${j + 1} is missing.`);
                        return;
                    }
                }
                costMatrix.push(row);
            }

            if (costMatrix.flat().includes(NaN)) {
                alert("Please fill in all cost values.");
                return;
            }

            // Calculate totals
            totalSupply = supply.reduce((a, b) => a + b, 0);
            totalDemand = demand.reduce((a, b) => a + b, 0);

            // Initialize allocation matrix without adding dummy row/column yet
            allocationMatrix = Array.from({ length: supplyCount }, () =>
                Array(demandCount).fill("")
            );
            steps = [];
            stepIndex = 0;
            dummyAdded = false;

            // First step: Show the initial state
            steps.push({
                message: "Initial state. Click 'Next Step' to begin allocation.",
                snapshot: allocationMatrix.map((row) => [...row]),
                supplyLeft: [...supply],
                demandLeft: [...demand],
                needsDummy: totalSupply !== totalDemand,
            });

            nextScreen("resultScreen");
            showNextStep();
        }

        function checkAllInputsExist() {
            // Check if all required inputs exist
            for (let i = 0; i < supplyCount; i++) {
                if (!document.getElementById(`supply${i}`)) {
                    return false;
                }
                for (let j = 0; j < demandCount; j++) {
                    if (!document.getElementById(`cost${i}_${j}`)) {
                        return false;
                    }
                }
            }

            for (let j = 0; j < demandCount; j++) {
                if (!document.getElementById(`demand${j}`)) {
                    return false;
                }
            }

            return true;
        }

        function showNextStep() {
            const stepOutput = document.getElementById("stepOutput");
            const allocationTable = document.getElementById("allocationTable");
            const nextStepButton = document.getElementById("nextStepButton");
            const stepHistoryBtn = document.getElementById("toggleStepHistoryBtn");

            if (stepIndex === 0) {
                // First step: Show initial state and add dummy if needed
                const { message, snapshot, supplyLeft, demandLeft, needsDummy } =
                    steps[0];

                // Clear the allocation table
                allocationTable.innerHTML = "";

                // Create the table header
                const header = document.createElement("tr");
                header.innerHTML =
                    "<th></th>" +
                    demand.map((_, j) => `<th>D${j + 1}</th>`).join("") +
                    "<th>SUPPLY</th>";
                allocationTable.appendChild(header);

                // Populate the table rows with the current snapshot
                snapshot.forEach((row, i) => {
                    const tr = document.createElement("tr");
                    tr.innerHTML =
                        `<th>S${i + 1}</th>` +
                        row
                            .map((val, j) => {
                                const cost = costMatrix[i][j];
                                return `<td><span class="cost-value">${cost}</span></td>`;
                            })
                            .join("") +
                        `<td>${supplyLeft[i]}</td>`;
                    allocationTable.appendChild(tr);
                });

                // Add the demand row
                const demandRow = document.createElement("tr");
                demandRow.innerHTML =
                    "<th>DEMAND</th>" +
                    demandLeft.map((val) => `<td>${val}</td>`).join("") +
                    `<td class="diagonal-cell">
            <div class="top-value ${needsDummy ? "not-equal" : "equal"
                    }">${totalSupply}</div>
            <div class="bottom-value ${needsDummy ? "not-equal" : "equal"
                    }">${totalDemand}</div>
          </td>`;
                allocationTable.appendChild(demandRow);

                // Update the step output
                if (needsDummy) {
                    stepOutput.innerHTML = `<p class="step">Total supply (${totalSupply}) and demand (${totalDemand}) are not equal. Click 'Next Step' to add a dummy row/column.</p>`;
                } else {
                    stepOutput.innerHTML = `<p class="step">${message}</p>`;
                }

                stepIndex++;
                // Hide and disable step history button on initial state
                const btn = document.getElementById("toggleStepHistoryBtn");
                if (btn) {
                  btn.disabled = true;
                  btn.style.display = "none";
                }
            } else if (
                stepIndex === 1 &&
                totalSupply !== totalDemand &&
                !dummyAdded
            ) {
                // Add dummy row/column if needed
                if (totalSupply > totalDemand) {
                    // Add dummy demand column
                    demand.push(totalSupply - totalDemand);
                    for (let i = 0; i < costMatrix.length; i++) {
                        costMatrix[i].push(0); // Cost to dummy demand
                    }
                    demandCount++;

                    // Update allocation matrix
                    allocationMatrix = Array.from({ length: supplyCount }, () =>
                        Array(demandCount).fill("")
                    );

                    // Push a step for adding dummy demand column
                    steps.push({
                        message: `Added dummy demand column DD${demandCount} with demand ${totalSupply - totalDemand
                            }.`,
                        snapshot: allocationMatrix.map((row) => [...row]),
                        supplyLeft: [...supply],
                        demandLeft: [...demand],
                    });

                    stepOutput.innerHTML = `<p class="step">Added dummy demand column DD${demandCount} with demand ${totalSupply - totalDemand
                        }.</p>`;
                } else if (totalDemand > totalSupply) {
                    // Add dummy supply row
                    supply.push(totalDemand - totalSupply);
                    const dummyRow = Array(demandCount).fill(0); // Cost from dummy supply
                    costMatrix.push(dummyRow);
                    supplyCount++;

                    // Update allocation matrix
                    allocationMatrix = Array.from({ length: supplyCount }, () =>
                        Array(demandCount).fill("")
                    );

                    // Push a step for adding dummy supply row
                    steps.push({
                        message: `Added dummy supply row DS${supplyCount} with supply ${totalDemand - totalSupply
                            }.`,
                        snapshot: allocationMatrix.map((row) => [...row]),
                        supplyLeft: [...supply],
                        demandLeft: [...demand],
                    });

                    stepOutput.innerHTML = `<p class="step">Added dummy supply row DS${supplyCount} with supply ${totalDemand - totalSupply
                        }.</p>`;
                }

                dummyAdded = true;

                // Show the updated table with dummy row/column
                allocationTable.innerHTML = "";

                // Create the table header
                const header = document.createElement("tr");
                header.innerHTML =
                    "<th></th>" +
                    demand
                        .map((_, j) => {
                            if (j === demandCount - 1 && totalSupply > totalDemand) {
                                return `<th>DD${j + 1}</th>`;
                            }
                            return `<th>D${j + 1}</th>`;
                        })
                        .join("") +
                    "<th>SUPPLY</th>";
                allocationTable.appendChild(header);

                // Populate the table rows with the current snapshot
                for (let i = 0; i < supplyCount; i++) {
                    const tr = document.createElement("tr");
                    let rowHeader = `<th>${i === supplyCount - 1 && totalDemand > totalSupply
                            ? "DS"
                            : "S" + (i + 1)
                        }</th>`;

                    let rowContent = "";
                    for (let j = 0; j < demandCount; j++) {
                        const cost = costMatrix[i][j];
                        rowContent += `<td><span class="cost-value">${cost}</span></td>`;
                    }

                    tr.innerHTML = rowHeader + rowContent + `<td>${supply[i]}</td>`;
                    allocationTable.appendChild(tr);
                }

                // Add the demand row
                const demandRow = document.createElement("tr");
                demandRow.innerHTML =
                    "<th>DEMAND</th>" +
                    demand.map((val) => `<td>${val}</td>`).join("") +
                    `<td class="diagonal-cell">
            <div class="top-value equal">${supply.reduce(
                        (a, b) => a + b,
                        0
                    )}</div>
            <div class="bottom-value equal">${demand.reduce(
                        (a, b) => a + b,
                        0
                    )}</div>
          </td>`;
                allocationTable.appendChild(demandRow);

                // Prepare for allocation steps
                prepareAllocationSteps();

                stepIndex++;
                // Show and enable step history button after first allocation step
                const btn = document.getElementById("toggleStepHistoryBtn");
                if (btn) {
                  btn.disabled = true;
                  btn.style.display = "none";
                }
            } else if (
                (stepIndex > 1 || (stepIndex === 1 && totalSupply === totalDemand)) &&
                stepIndex <= steps.length
            ) {
                // Regular allocation steps
                let currentStep;

                if (totalSupply === totalDemand && stepIndex === 1) {
                    // If supply equals demand, we need to prepare the allocation steps first
                    prepareAllocationSteps();

                    // Then get the first prepared allocation step
                    currentStep = steps[1];
                } else {
                    // Get the current step (adjusted for dummy step)
                    const stepAdjustment = totalSupply !== totalDemand ? 1 : 0;
                    const adjustedIndex = stepIndex - stepAdjustment;

                    // Check if the step exists before trying to access it
                    if (adjustedIndex < steps.length) {
                        currentStep = steps[adjustedIndex];
                    } else {
                        // If we've reached the end of the steps, show the final state
                        showFinalState();
                        return;
                    }
                }

                if (!currentStep) {
                    console.error("Current step is undefined at index:", stepIndex);
                    showFinalState();
                    return;
                }

                const { message, snapshot, supplyLeft, demandLeft } = currentStep;

                // Clear the allocation table
                allocationTable.innerHTML = "";

                // Create the table header
                const header = document.createElement("tr");
                header.innerHTML =
                    "<th></th>" +
                    demand
                        .map((_, j) => {
                            if (j === demandCount - 1 && totalSupply > totalDemand) {
                                return `<th>DD${j + 1}</th>`;
                            }
                            return `<th>D${j + 1}</th>`;
                        })
                        .join("") +
                    "<th>SUPPLY</th>";
                allocationTable.appendChild(header);

                // Populate the table rows with the current snapshot
                snapshot.forEach((row, i) => {
                    const tr = document.createElement("tr");
                    let rowHeader = `<th>${i === supplyCount - 1 && totalDemand > totalSupply
                            ? "DS" + (i + 1)
                            : "S" + (i + 1)
                        }</th>`;

                    let rowContent = "";
                    for (let j = 0; j < demandCount; j++) {
                        const cost = costMatrix[i][j];
                        const val = row[j];
                        if (val === "" || val === 0 || val === undefined) {
                            if (supplyLeft[i] === 0 || demandLeft[j] === 0) {
                                rowContent += `<td><span class="cost-value">${cost}</span><span class="blocked-cell">X</span></td>`;
                            } else {
                                rowContent += `<td><span class="cost-value">${cost}</span></td>`;
                            }
                        } else {
                            rowContent += `<td><span class="cost-value">${cost}</span><span class="allocation-value">${val}</span></td>`;
                        }
                    }

                    tr.innerHTML = rowHeader + rowContent + `<td>${supplyLeft[i]}</td>`;
                    allocationTable.appendChild(tr);
                });

                // Add the demand row
                const demandRow = document.createElement("tr");
                demandRow.innerHTML =
                    "<th>DEMAND</th>" +
                    demandLeft.map((val) => `<td>${val}</td>`).join("") +
                    `<td class="diagonal-cell">
            <div class="top-value equal">${supply.reduce(
                        (a, b) => a + b,
                        0
                    )}</div>
            <div class="bottom-value equal">${demand.reduce(
                        (a, b) => a + b,
                        0
                    )}</div>
          </td>`;
                allocationTable.appendChild(demandRow);

                // Update the step output
                stepOutput.innerHTML = `<p class="step">${message}</p>`;
                stepIndex++;

                // Show and enable step history button after first allocation step
                const btn = document.getElementById("toggleStepHistoryBtn");
                if (btn) {
                  btn.disabled = true;
                  btn.style.display = "none";
                }
                // Check if we've reached the end of the steps
                if (stepIndex > steps.length) {
                        // After the last step, change button to "Compute Cost"
                        nextStepButton.textContent = "Compute Cost";
                        nextStepButton.onclick = displayFinalCost;
                        // Show and enable step history button now
                        const btn = document.getElementById("toggleStepHistoryBtn");
                        if (btn) {
                        btn.disabled = false;
                        btn.style.display = "";
                        }
                }
            } else {
                // We shouldn't get here normally, but just in case
                showFinalState();
            }
        }

        function prepareAllocationSteps() {
            // Prepare the allocation steps
            let supplyLeft = [...supply];
            let demandLeft = [...demand];
            let i = 0, j = 0;

            while (i < supplyCount && j < demandCount) {
                let alloc = Math.min(supplyLeft[i], demandLeft[j]);
                allocationMatrix[i][j] = alloc;

                steps.push({
                    message: `Allocating ${alloc} units from ${i === supplyCount - 1 && totalDemand > totalSupply ? "DS" : "S"
                        }${i + 1} to ${j === demandCount - 1 && totalSupply > totalDemand ? "DD" : "D"
                        }${j + 1}`,
                    snapshot: allocationMatrix.map((row) => [...row]),
                    supplyLeft: [...supplyLeft],
                    demandLeft: [...demandLeft],
                });

                supplyLeft[i] -= alloc;
                demandLeft[j] -= alloc;

                if (supplyLeft[i] === 0) i++;
                if (demandLeft[j] === 0) j++;
            }

            // Add a final step to show all allocations complete
            steps.push({
                message: "All allocations completed. Supply and demand are now zero.",
                snapshot: allocationMatrix.map((row) => [...row]),
                supplyLeft: Array(supplyCount).fill(0),
                demandLeft: Array(demandCount).fill(0),
            });
        }

        function showFinalState() {
            const stepOutput = document.getElementById("stepOutput");
            const allocationTable = document.getElementById("allocationTable");
            const nextStepButton = document.getElementById("nextStepButton");

            // Clear the allocation table
            allocationTable.innerHTML = "";

            // Create the table header
            const header = document.createElement("tr");
            header.innerHTML =
                "<th></th>" +
                demand
                    .map((_, j) => {
                        if (j === demandCount - 1 && totalSupply > totalDemand) {
                            return `<th>DD${j + 1}</th>`;
                        }
                        return `<th>D${j + 1}</th>`;
                    })
                    .join("") +
                "<th>SUPPLY</th>";
            allocationTable.appendChild(header);

            // Populate the table rows with the final allocations
            allocationMatrix.forEach((row, i) => {
                const tr = document.createElement("tr");
                let rowHeader = `<th>${i === supplyCount - 1 && totalDemand > totalSupply
                        ? "DS" + (i + 1)
                        : "S" + (i + 1)
                    }</th>`;

                let rowContent = "";
                for (let j = 0; j < demandCount; j++) {
                    const cost = costMatrix[i][j];
                    const val = row[j];
                    if (val === "" || val === 0 || val === undefined) {
                        rowContent += `<td><span class="cost-value">${cost}</span><span class="blocked-cell">X</span></td>`;
                    } else {
                        rowContent += `<td><span class="cost-value">${cost}</span><span class="allocation-value">${val}</span></td>`;
                    }
                }

                tr.innerHTML = rowHeader + rowContent + `<td>0</td>`;
                allocationTable.appendChild(tr);
            });

            // Add the demand row
            const demandRow = document.createElement("tr");
            demandRow.innerHTML =
                "<th>DEMAND</th>" +
                demand.map(() => `<td>0</td>`).join("") +
                `<td class="diagonal-cell">
          <div class="top-value equal">0</div>
          <div class="bottom-value equal">0</div>
        </td>`;
            allocationTable.appendChild(demandRow);

            // Update the step output
            stepOutput.innerHTML = `<p class="step" style="color: green;">All allocations completed. Supply and demand are now zero.</p>`;

            // Change the button to "Compute Cost"
            nextStepButton.textContent = "Compute Cost";
            nextStepButton.onclick = displayFinalCost;
            // Show and enable step history button now
            const btn = document.getElementById("toggleStepHistoryBtn");
            if (btn) {
              btn.disabled = false;
              btn.style.display = "";
            }
        }

        function displayFinalCost() {
            const stepOutput = document.getElementById("stepOutput");
            const allocationTable = document.getElementById("allocationTable");
            const nextStepButton = document.getElementById("nextStepButton");
            let totalCost = 0;

            // Check if the cost computation table already exists
            const existingCostComputationDiv = document.getElementById("costComputationDiv");
            if (existingCostComputationDiv) {
                existingCostComputationDiv.remove(); // Remove the existing table to avoid duplicates
            }

            // Create the cost computation table
            let html = '<h3>Cost Computation</h3><table border="1"><tr><th>From</th><th>To</th><th>Allocation</th><th>Unit Cost</th><th>Total</th></tr>';
            const costDetails = { totalCost: 0, allocations: [] };

            for (let i = 0; i < supplyCount; i++) {
                for (let j = 0; j < demandCount; j++) {
                    const alloc = allocationMatrix[i][j];
                    if (alloc !== "") {
                        const cost = costMatrix[i][j];
                        const total = alloc * cost;
                        totalCost += total;

                        const fromLabel = i === supplyCount - 1 && totalDemand > totalSupply ? `DS${i + 1}` : `S${i + 1}`;
                        const toLabel = j === demandCount - 1 && totalSupply > totalDemand ? `DD${j + 1}` : `D${j + 1}`;

                        html += `<tr><td>${fromLabel}</td><td>${toLabel}</td><td>${alloc}</td><td>${cost}</td><td>${total}</td></tr>`;

                        // Add to cost details for step history
                        costDetails.allocations.push({
                            row: i,
                            col: j,
                            amount: alloc,
                            cost: cost
                        });
                    }
                }
            }
            costDetails.totalCost = totalCost;

            // Add cost details to the final step
            if (steps.length > 0) {
                steps[steps.length - 1].costDetails = costDetails;
            }

            html += `<tr><td colspan="4"><strong>Total Cost</strong></td><td><strong>${totalCost}</strong></td></table>`;

            // Append the cost computation table below the allocation table
            const costComputationDiv = document.createElement("div");
            costComputationDiv.id = "costComputationDiv"; // Add an ID to identify the div
            costComputationDiv.innerHTML = html;
            allocationTable.parentNode.insertBefore(costComputationDiv, allocationTable.nextSibling);

            // Update the button to "Apply Stepping Stone Method"
            nextStepButton.textContent = "Apply Stepping Stone Method";
            nextStepButton.onclick = showLatestTableBeforeSteppingStone;
        }

        let allocation = [];
        let valuesMatrix = [];


        function showLatestTableBeforeSteppingStone() {
    // Instead of clearing the result screen, switch to the stepping stone screen
    nextScreen('steppingStoneScreen');

    // Get the stepping stone containers
    const outputDiv = document.getElementById('steppingStoneOutput');
    const tableDiv = document.getElementById('steppingStoneTable');
    if (!outputDiv || !tableDiv) {
        console.error("Stepping stone containers not found.");
        return;
    }

    // Clear previous content
    outputDiv.innerHTML = "";
    tableDiv.innerHTML = "";

    // Clone the current allocation table
    const allocationTable = document.getElementById("allocationTable");
    if (!allocationTable) {
        console.error("Allocation table not found.");
        return;
    }
    const clonedTable = allocationTable.cloneNode(true);

    // Create a container to display the latest table
    const latestTableDiv = document.createElement("div");
    latestTableDiv.id = "latestTableDiv";
    latestTableDiv.innerHTML = "<h3>Latest Allocation Table</h3>";
    latestTableDiv.appendChild(clonedTable);

    // Add the latest table to the stepping stone output
    outputDiv.appendChild(latestTableDiv);

    // Create a container for the buttons (remove any previous)
    let buttonContainer = document.getElementById("steppingStoneNavButtons");
    if (buttonContainer) buttonContainer.remove();
    buttonContainer = document.createElement("div");
    buttonContainer.id = "steppingStoneNavButtons";
    buttonContainer.style.display = "flex";
    buttonContainer.style.gap = "10px";
    buttonContainer.style.justifyContent = "center"; // Center the buttons
    buttonContainer.style.marginTop = "18px"; // Add some spacing above

    // Create navigation buttons
    const backButton = document.createElement("button");
    backButton.textContent = "Back";
    backButton.onclick = goBackToInputMatrix;

    const nextButton = document.createElement("button");
    nextButton.textContent = "Next (Step-by-Step Stepping Stone)";
    nextButton.onclick = function () {
        // --- Build step-by-step data for stepping stone ---
        const loops = findAllClosedPaths(allocation);
        let stepsArray = [];
        let tempAllocation = allocation.map(row => row.slice());
        let tempSupply = supply ? supply.slice() : Array(allocation.length).fill(0);
        let tempDemand = demand ? demand.slice() : Array(allocation[0].length).fill(0);
        let colHeaders = Array.from({length: allocation[0].length}, (_, j) => `D${j+1}`);
        let rowHeaders = Array.from({length: allocation.length}, (_, i) => `S${i+1}`);
        let values = valuesMatrix;

        loops.forEach((loopObj, index) => {
            const path = loopObj.path;
            const selected = loopObj.start;
            const costPath = getValuesFromPath(path, values);
            const allocPath = getValuesFromPath(path, tempAllocation);
            const signLabels = path.map((_, idx) => idx % 2 === 0 ? '+' : '-');
            const signedValues = alternateSigns(costPath);
            const allocationsignedValues = alternateSigns(allocPath);
            const sum = evaluateExpression(signedValues);
            // Find minimum among negative positions in allocation path
            let minNegative = Infinity;
            allocationsignedValues.forEach((v, idx) => {
                if (signLabels[idx] === '-' && v < minNegative && v > 0) minNegative = v;
            });
            if (!isFinite(minNegative)) minNegative = 0;
            // Build displayRows for the table
            let displayRows = tempAllocation.map((row, i) =>
                row.map((cell, j) => {
                    // Is this cell in the path?
                    let pathIdx = path.findIndex(([pi, pj]) => pi === i && pj === j);
                    if (pathIdx !== -1) {
                        return {
                            val: cell,
                            net: costPath[pathIdx],
                            sign: signLabels[pathIdx],
                            highlight: false
                        };
                    } else {
                        return { val: cell };
                    }
                })
            );
            // Mark the minimum negative cell
            path.forEach(([i, j], idx) => {
                if (signLabels[idx] === '-' && tempAllocation[i][j] === minNegative) {
                    displayRows[i][j].highlight = true;
                }
            });
            stepsArray.push({
                selected,
                path,
                colHeaders,
                rowHeaders,
                displayRows,
                supply: tempSupply,
                demand: tempDemand,
                minNegative
            });
            // Apply adjustment for next step
            if (minNegative > 0) {
                path.forEach(([i, j], idx) => {
                    if (signLabels[idx] === '+') tempAllocation[i][j] += minNegative;
                    else if (signLabels[idx] === '-') tempAllocation[i][j] -= minNegative;
                });
            }
        });
        // Show the step-by-step UI
        showSteppingStoneStepByStep(stepsArray, tempAllocation);
    };

    // Add buttons to the container
    buttonContainer.appendChild(backButton);
    buttonContainer.appendChild(nextButton);

    // Add the button container to the stepping stone output
    outputDiv.appendChild(buttonContainer);

    // Build allocation and valuesMatrix from the table
    allocation = [];
    valuesMatrix = [];
    const rows = allocationTable.querySelectorAll("tr");
    rows.forEach((row, rowIndex) => {
        if (rowIndex === rows.length - 1) return;
        const allocationRow = [];
        const costRow = [];
        const cells = row.querySelectorAll("td");
        cells.forEach((cell, cellIndex) => {
            if (cellIndex === cells.length - 1) return;
            const allocationValue = cell.querySelector(".allocation-value");
            const costValue = cell.querySelector(".cost-value");
            allocationRow.push(allocationValue ? parseInt(allocationValue.textContent) : 0);
            costRow.push(costValue ? parseInt(costValue.textContent) : 0);
        });
        if (allocationRow.length > 0) allocation.push(allocationRow);
        if (costRow.length > 0) valuesMatrix.push(costRow);
    });
    // Log the arrays to the console
    console.log("Allocation Table:");
    allocation.forEach((row) => console.log(row.join("\t")));
    console.log("Cost Table:");
    valuesMatrix.forEach((row) => console.log(row.join("\t")));
}

        // 1. Get unallocated cells
        function getAllUnallocatedCells(allocations) {
        const unallocated = [];
        for (let i = 0; i < allocations.length; i++) {
            for (let j = 0; j < allocations[0].length; j++) {
            if (allocations[i][j] === 0) {
                unallocated.push([i, j]);
            }
            }
        }
        return unallocated;
        }

        // 2. Find closed loop using DFS
        function findClosedPath(start, allocations) {
        const rows = allocations.length;
        const cols = allocations[0].length;

        function dfs(x, y, path, visited, isRowSearch) {
            if (
            path.length >= 4 &&
            ((isRowSearch && x === start[0]) || (!isRowSearch && y === start[1])) &&
            start[0] === x &&
            start[1] === y
            ) {
            return true;
            }

            const candidates = [];

            if (isRowSearch) {
            for (let j = 0; j < cols; j++) {
                const isStart = (x === start[0] && j === start[1]);
                if ((j !== y || isStart) && (allocations[x][j] > 0 || isStart)) {
                candidates.push([x, j]);
                }
            }
            } else {
            for (let i = 0; i < rows; i++) {
                const isStart = (i === start[0] && y === start[1]);
                if ((i !== x || isStart) && (allocations[i][y] > 0 || isStart)) {
                candidates.push([i, y]);
                }
            }
            }

            for (const [nextX, nextY] of candidates) {
            if ((nextX === start[0] && nextY === start[1]) && path.length >= 4) {
                if ((isRowSearch && nextX === x) || (!isRowSearch && nextY === y)) {
                path.push([nextX, nextY]);
                return true;
                } else {
                continue;
                }
            }

            if (visited[nextX][nextY]) continue;

            visited[nextX][nextY] = true;
            path.push([nextX, nextY]);

            if (dfs(nextX, nextY, path, visited, !isRowSearch)) {
                return true;
            }

            path.pop();
            visited[nextX][nextY] = false;
            }

            return false;
        }

        const visited = Array.from({ length: rows }, () => Array(cols).fill(false));
        const path = [start];
        visited[start[0]][start[1]] = true;

        if (dfs(start[0], start[1], path, visited, true)) {
            return path.slice(0, -1);
        }
        return null;
        }

        // 3. Collect all valid loops
        function findAllClosedPaths(allocations) {
        const unallocatedCells = getAllUnallocatedCells(allocations);
        const allPaths = [];

        for (const cell of unallocatedCells) {
            const loop = findClosedPath(cell, allocations);
            if (loop) {
            allPaths.push({ start: cell, path: loop });
            }
        }

        return allPaths;
        }

        // 4. Extract values from the matrix
        function getValuesFromPath(path, valuesMatrix) {
        return path.map(([i, j]) => valuesMatrix[i][j]);
        }

        function getAllocationFromPath(path, allocations) {
        return path.map(([i, j]) => allocations[i][j]);
        }

        // 5. Assign + and - alternately
        function alternateSigns(values) {
        return values.map((val, idx) => (idx % 2 === 0 ? val : -val));
        }

        // 6. Evaluate sum
        function evaluateExpression(signedValues) {
        return signedValues.reduce((acc, val) => acc + val, 0);
        }

        // 7. Label positions with + and - only (for display)
        function labelSigns(path) {
        return path.map((_, idx) => (idx % 2 === 0 ? '+' : '-'));
        }

        // 8. Adjust values by adding the smallest negative value
        function adjustByLeastNegative(signedArray) {
        const negatives = signedArray.filter(v => v < 0);
        if (negatives.length === 0) return signedArray;

        const leastNegative = Math.max(...negatives);
        const adjustment = Math.abs(leastNegative);


        const adjusted = signedArray.map(v => v + adjustment);
        console.log("Least Negative Value (converted):", leastNegative);
        console.log("Adjustment applied to all:", adjustment);
        console.log("Adjusted Values:", adjusted);
        return adjusted;

        
        }
        function normalizeValues(array) {
        const normalized = array.map(v => Math.abs(v));
        console.log("Normalized Adjusted Values:", normalized);
        return normalized;
    }

        function applyAdjustedValuesToAllocation(path, adjustedValues, allocationMatrix) {
            for (let i = 0; i < path.length; i++) {
                const [row, col] = path[i];
                allocationMatrix[row][col] = adjustedValues[i];
            }

            console.log("Updated Allocation Matrix:");
            allocationMatrix.forEach(row => console.log(row.join('\t')));
        }
        
        function updateAllocationTableUI() {
    const table = document.getElementById("allocationTable");
    if (!table) {
        console.error("Allocation table element not found.");
        return;
    }

    const rows = table.querySelectorAll("tr");
    rows.forEach((row, i) => {
        if (i >= allocation.length) return;
        const cells = row.querySelectorAll("td");
        cells.forEach((cell, j) => {
            if (j >= allocation[i].length) return;
            const allocationSpan = cell.querySelector(".allocation-value");
            if (allocationSpan) {
                allocationSpan.textContent = allocation[i][j];
            }
        });
    });
}

function updateAllocationTableUI() {
    const table = document.getElementById("allocationTable");
    if (!table) {
        console.error("Allocation table element not found.");
        return;
    }

    const rows = table.querySelectorAll("tr");
    rows.forEach((row, i) => {
        if (i >= allocation.length) return;
        const cells = row.querySelectorAll("td");
        cells.forEach((cell, j) => {
            if (j >= allocation[i].length) return;
            const allocationSpan = cell.querySelector(".allocation-value");
            if (allocationSpan) {
                allocationSpan.textContent = allocation[i][j]; 
                console.log(allocation[i][j]);
            }
        });
    });
}

        function displayFinalCostSteppingStone() {
            let totalCost = 0;

            // Check if the cost computation table already exists
            const existingCostComputationDiv = document.getElementById("costComputationDiv");
            if (existingCostComputationDiv) {
                existingCostComputationDiv.remove(); // Remove the existing table to avoid duplicates
            }

            // Create the cost computation table
            let html = '<h3>Cost Computation</h3><table border="1"><tr><th>From</th><th>To</th><th>Allocation</th><th>Unit Cost</th><th>Total</th></tr>';
            const costDetails = { totalCost: 0, allocations: [] };

            for (let i = 0; i < supplyCount; i++) {
                for (let j = 0; j < demandCount; j++) {
                    const alloc = allocation[i][j];
                    if (alloc !== "") {
                        const cost = valuesMatrix[i][j];
                        const total = alloc * cost;
                        totalCost += total;

                        const fromLabel = i === supplyCount - 1 && totalDemand > totalSupply ? `DS${i + 1}` : `S${i + 1}`;
                        const toLabel = j === demandCount - 1 && totalSupply > totalDemand ? `DD${j + 1}` : `D${j + 1}`;

                        html += `<tr><td>${fromLabel}</td><td>${toLabel}</td><td>${alloc}</td><td>${cost}</td><td>${total}</td></tr>`;

                        // Add to cost details for step history
                        costDetails.allocations.push({
                            row: i,
                            col: j,
                            amount: alloc,
                            cost: cost
                        });
                    }
                }
            }
            costDetails.totalCost = totalCost;

            // Add cost details to the final step
            if (steps.length > 0) {
                steps[steps.length - 1].costDetails = costDetails;
            }

            html += `<tr><td colspan="4"><strong>Total Cost</strong></td><td><strong>${totalCost}</strong></td></table>`;

            // Append the cost computation table below the allocation table
            const costComputationDiv = document.createElement("div");
            costComputationDiv.id = "costComputationDiv"; // Add an ID to identify the div
            costComputationDiv.innerHTML = html;
            allocationTable.parentNode.insertBefore(costComputationDiv, allocationTable.nextSibling);

        }

        // Add event listener for the step history button
        window.addEventListener('DOMContentLoaded', function() {
            const stepHistoryBtn = document.getElementById("toggleStepHistoryBtn");
            if (stepHistoryBtn) {
                stepHistoryBtn.addEventListener("click", function() {
                    // Show the modal
                    document.getElementById("stepHistoryModal").style.display = "flex";
                    // Populate the step history container
                    const container = document.getElementById("stepHistoryContainer");
                    if (container) {
                        container.innerHTML = steps.map((step, idx) => {
                            // Build the allocation table for this step
                            let tableHtml = '<table class="mini-allocation-table" style="margin:8px 0 8px 0; border-collapse:collapse; background:#fff;">';
                            // Table header
                            tableHtml += '<tr><th></th>';
                            if (step.demandLeft) {
                                for (let j = 0; j < step.demandLeft.length; j++) {
                                    tableHtml += `<th>D${j+1}</th>`;
                                }
                                tableHtml += '<th>SUPPLY</th>';
                            }
                            tableHtml += '</tr>';
                            // Table rows
                            if (step.snapshot && step.supplyLeft && step.demandLeft) {
                                for (let i = 0; i < step.snapshot.length; i++) {
                                    tableHtml += `<tr><th>S${i+1}</th>`;
                                    for (let j = 0; j < step.snapshot[i].length; j++) {
                                        tableHtml += `<td style="border:1px solid #b583d8; min-width:24px; text-align:center;">${step.snapshot[i][j] !== undefined && step.snapshot[i][j] !== '' ? step.snapshot[i][j] : ''}</td>`;
                                    }
                                    tableHtml += `<td style="border:1px solid #b583d8; min-width:24px; text-align:center;">${step.supplyLeft[i]}</td></tr>`;
                                }
                                // Demand row
                                tableHtml += '<tr><th>DEMAND</th>';
                                for (let j = 0; j < step.demandLeft.length; j++) {
                                    tableHtml += `<td style="border:1px solid #b583d8; min-width:24px; text-align:center;">${step.demandLeft[j]}</td>`;
                                }
                                tableHtml += '<td></td></tr>';
                            }
                            tableHtml += '</table>';
                            return `<div style="margin-bottom:18px;"><b>Step ${idx + 1}:</b> ${step.message}${tableHtml}</div>`;
                        }).join("");
                    }
                });
            }
        });

        // Function to close the step history modal
        function closeStepHistoryModal() {
            document.getElementById("stepHistoryModal").style.display = "none";
        }

// --- STEPPING STONE HISTORY & DISPLAY UI ---
function showSteppingStoneScreen(loops, finalMatrix, stepHistory) {
  // Switch to stepping stone screen
  nextScreen('steppingStoneScreen');

  // Render loop steps
  const outputDiv = document.getElementById('steppingStoneOutput');
  outputDiv.innerHTML = '';
  loops.forEach((loop, idx) => {
    const div = document.createElement('div');
    div.className = 'loop-step';
    div.style.border = '1px solid #aaa';
    div.style.margin = '18px 0';
    div.style.padding = '12px';
    // Format path as SxDy → ...
    const pathStr = loop.path.map(([i, j]) => `S${i + 1}D${j + 1}`).join(' → ');
    // Show plus/minus allocation for each cell in the path
    const signLabels = loop.path.map((_, idx) => idx % 2 === 0 ? '(+)' : '(-)');
    // Table with allocations and net evaluations
    let tableHtml = '<table style="border-collapse:collapse;margin:10px 0;">';
    tableHtml += '<tr><th></th>' + loop.colHeaders.map(h => `<th>${h}</th>`).join('') + '<th>Supply</th></tr>';
    loop.displayRows.forEach((row, i) => {
      tableHtml += '<tr>';
      tableHtml += `<th>${loop.rowHeaders[i]}</th>`;
      row.forEach(cell => {
        if (typeof cell === 'object') {
          // {val, net, sign, highlight}
          let style = '';
          if (cell.highlight) style += 'font-weight:bold;color:green;';
          if (cell.sign === '+') style += 'color:green;';
          if (cell.sign === '-') style += 'color:red;';
          tableHtml += `<td style="${style}">${cell.val} ${cell.net !== undefined ? `<span style='font-size:12px;${cell.sign==='+'?'color:green;':'color:red;'}'>[${cell.net}${cell.sign}]</span>` : ''}</td>`;
        } else {
          tableHtml += `<td>${cell}</td>`;
        }
      });
      tableHtml += `<td>${loop.supply[i]}</td></tr>`;
    });
    tableHtml += '<tr><th>Demand</th>' + loop.demand.map(d => `<td>${d}</td>`).join('') + '<td></td></tr>';
    tableHtml += '</table>';
    // Step description
    div.innerHTML = `
      <h4>Step ${idx + 1}: Stepping Stone Path</h4>
      <div><b>Selected Cell:</b> <span style="color:#b583d8;font-weight:bold;">S${loop.selected[0] + 1}D${loop.selected[1] + 1}</span></div>
      <div><b>Closed Path:</b> <span style="color:#5c4b7d;">${pathStr}</span></div>
      <div><b>Plus/Minus Allocation:</b> <span>${signLabels.join(' ')}</span></div>
      <div style="margin:8px 0 0 0;">${tableHtml}</div>
      <div style="margin-top:8px;"><b>Minimum allocated value among all (-) on closed path:</b> <span style="color:red;">${loop.minNegative}</span></div>
      <div><b>Adjustment:</b> Subtract <span style="color:red;">${loop.minNegative}</span> from all (-) and add to all (+)</div>
    `;
    outputDiv.appendChild(div);
  });

  // Render final allocation matrix
  const tableDiv = document.getElementById('steppingStoneTable');
  tableDiv.innerHTML = renderFinalAllocationMatrix(finalMatrix);

  // Render step history button
  let btn = document.getElementById('showSteppingStoneHistoryBtn');
  if (!btn) {
    btn = document.createElement('button');
    btn.id = 'showSteppingStoneHistoryBtn';
    btn.textContent = 'Show Step History';
    btn.className = 'history-btn';
    btn.onclick = function() {
      showSteppingStoneHistoryModal(stepHistory);
    };
    tableDiv.parentNode.insertBefore(btn, tableDiv.nextSibling);
  }
}

function renderFinalAllocationMatrix(matrix) {
  let html = '<table class="allocation-matrix-table">';
  matrix.forEach((row) => {
    html += '<tr>' + row.map(cell => `<td>${cell}</td>`).join('') + '</tr>';
  });
  html += '</table>';
  return html;
}

function showSteppingStoneHistoryModal(historyArr) {
  let modal = document.getElementById('steppingStoneHistoryModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'steppingStoneHistoryModal';
    modal.className = 'modal';
    modal.style.display = 'flex';
    modal.innerHTML = `
      <div class="modal-content" style="background:#fff; border-radius:10px; padding:24px 20px 16px 20px; min-width:350px; max-width:90vw; max-height:80vh; overflow-y:auto; box-shadow:0 2px 24px rgba(0,0,0,0.18); position:relative;">
        <button class="close-modal" style="position:absolute;top:8px;right:16px;font-size:22px;color:#b583d8;background:none;border:none;cursor:pointer;" onclick="document.getElementById('steppingStoneHistoryModal').remove()">&times;</button>
        <h3 style="margin-top:0;">Stepping Stone Step History</h3>
        <div id="steppingStoneHistoryContainer" style="max-height: 350px; overflow-y: auto; width: 95%; margin-top: 10px; border: 1px solid #b583d8; border-radius: 8px; background: #faf7ff; padding: 10px; display: block;"></div>
      </div>
    `;
    document.body.appendChild(modal);
  }
  // Fill history
  const panel = document.getElementById('steppingStoneHistoryContainer');
  panel.innerHTML = '';
  historyArr.forEach((step, idx) => {
    const div = document.createElement('div');
    div.className = 'step-history-item';
    div.style.marginBottom = '8px';
    div.innerHTML = `<b>Step ${idx + 1}:</b> ${step}`;
    panel.appendChild(div);
  });
}

// --- STEPPING STONE STEP-BY-STEP UI ---
function showSteppingStoneStepByStep(steps, finalMatrix) {
  // Fix: Ensure nextScreen is defined in this scope
  if (typeof nextScreen !== "function") {
    window.nextScreen = function(screenId) {
      document
        .querySelectorAll(".screen")
        .forEach((s) => s.classList.remove("active"));
      document.getElementById(screenId).classList.add("active");
    };
  }
  nextScreen('steppingStoneScreen');
  const outputDiv = document.getElementById('steppingStoneOutput');
  outputDiv.innerHTML = '';

  let currentStep = 0;

  function renderStep(idx) {
    outputDiv.innerHTML = '';
    const step = steps[idx];
    if (!step) return;
    // Format path as SxDy → ...
    const pathStr = step.path.map(([i, j]) => `S${i + 1}D${j + 1}`).join(' → ');
    const signLabels = step.path.map((_, i) => i % 2 === 0 ? '(+)' : '(-)');
    let tableHtml = '<table style="border-collapse:collapse;margin:10px 0;">';
    tableHtml += '<tr><th></th>' + step.colHeaders.map(h => `<th>${h}</th>`).join('') + '<th>Supply</th></tr>';
    step.displayRows.forEach((row, i) => {
      tableHtml += '<tr>';
      tableHtml += `<th>${step.rowHeaders[i]}</th>`;
      row.forEach(cell => {
        if (typeof cell === 'object') {
          let style = '';
          if (cell.highlight) style += 'font-weight:bold;color:green;';
          if (cell.sign === '+') style += 'color:green;';
          if (cell.sign === '-') style += 'color:red;';
          tableHtml += `<td style="${style}">${cell.val} ${cell.net !== undefined ? `<span style='font-size:12px;${cell.sign==='+'?'color:green;':'color:red;'}'>[${cell.net}${cell.sign}]</span>` : ''}</td>`;
        } else {
          tableHtml += `<td>${cell}</td>`;
        }
      });
      tableHtml += `<td>${step.supply[i]}</td></tr>`;
    });
    tableHtml += '<tr><th>Demand</th>' + step.demand.map(d => `<td>${d}</td>`).join('') + '<td></td></tr>';
    tableHtml += '</table>';
    outputDiv.innerHTML = `
      <h4>Step ${idx + 1}: Stepping Stone Path</h4>
      <div><b>Selected Cell:</b> <span style="color:#b583d8;font-weight:bold;">S${step.selected[0] + 1}D${step.selected[1] + 1}</span></div>
      <div><b>Closed Path:</b> <span style="color:#5c4b7d;">${pathStr}</span></div>
      <div><b>Plus/Minus Allocation:</b> <span>${signLabels.join(' ')}</span></div>
      <div style="margin:8px 0 0 0;">${tableHtml}</div>
      <div style="margin-top:8px;"><b>Minimum allocated value among all (-) on closed path:</b> <span style="color:red;">${step.minNegative}</span></div>
      <div><b>Adjustment:</b> Subtract <span style="color:red;">${step.minNegative}</span> from all (-) and add to all (+)</div>
    `;
  }

  // Navigation buttons: Only "Back" and "Next Step"
  let btnContainer = document.getElementById('steppingStoneStepNav');
  if (!btnContainer) {
    btnContainer = document.createElement('div');
    btnContainer.id = 'steppingStoneStepNav';
    btnContainer.style.display = 'flex';
    btnContainer.style.gap = '10px';
    btnContainer.style.justifyContent = 'center';
    btnContainer.style.marginTop = '18px';
  } else {
    btnContainer.innerHTML = '';
  }

  const backBtn = document.createElement('button');
  backBtn.textContent = 'Back';
  backBtn.onclick = function() {
    goBackToInputMatrix();
  };
  btnContainer.appendChild(backBtn);

  const nextBtn = document.createElement('button');
  nextBtn.textContent = 'Next Step';
  nextBtn.onclick = function() {
    if (currentStep < steps.length - 1) {
      currentStep++;
      renderStep(currentStep);
    } else {
      // Show final allocation matrix
      outputDiv.innerHTML = '<h4>Final Allocation Matrix</h4>' + renderFinalAllocationMatrix(finalMatrix);

      // Add navigation buttons below the matrix, centered
      const navWrapper = document.createElement('div');
      navWrapper.style.display = 'flex';
      navWrapper.style.justifyContent = 'center';
      navWrapper.appendChild(btnContainer);
      outputDiv.appendChild(navWrapper);

      // Add "Show Step History" button below navigation buttons, centered
      let showHistoryBtn = document.createElement('button');
      showHistoryBtn.textContent = 'Show Step History';
      showHistoryBtn.className = 'history-btn';
      showHistoryBtn.style.marginTop = '16px';
      showHistoryBtn.style.display = 'block';
      showHistoryBtn.style.marginLeft = 'auto';
      showHistoryBtn.style.marginRight = 'auto';
      showHistoryBtn.onclick = function() {
        let modal = document.getElementById('steppingStoneStepHistoryModal');
        if (!modal) {
          modal = document.createElement('div');
          modal.id = 'steppingStoneStepHistoryModal';
          modal.className = 'modal';
          modal.style.display = 'flex';
          modal.innerHTML = `
            <div class="modal-content" style="background:#fff; border-radius:10px; padding:24px 20px 16px 20px; min-width:350px; max-width:90vw; max-height:80vh; overflow-y:auto; box-shadow:0 2px 24px rgba(0,0,0,0.18); position:relative;">
              <button class="close-modal" style="position:absolute;top:8px;right:16px;font-size:22px;color:#b583d8;background:none;border:none;cursor:pointer;" onclick="document.getElementById('steppingStoneStepHistoryModal').remove()">&times;</button>
              <h3 style="margin-top:0;">Stepping Stone Step History</h3>
              <div id="steppingStoneStepHistoryContainer" style="max-height: 350px; overflow-y: auto; width: 95%; margin-top: 10px; border: 1px solid #b583d8; border-radius: 8px; background: #faf7ff; padding: 10px; display: block;"></div>
            </div>
          `;
          document.body.appendChild(modal);
        }
        const panel = document.getElementById('steppingStoneStepHistoryContainer');
        panel.innerHTML = steps.map((step, idx) => {
          let tableHtml = '<table class="mini-allocation-table" style="margin:8px 0 8px 0; border-collapse:collapse; background:#fff;">';
          tableHtml += '<tr><th></th>';
          for (let j = 0; j < step.colHeaders.length; j++) {
            tableHtml += `<th>${step.colHeaders[j]}</th>`;
          }
          tableHtml += '<th>Supply</th></tr>';
          for (let i = 0; i < step.displayRows.length; i++) {
            tableHtml += `<tr><th>${step.rowHeaders[i]}</th>`;
            for (let j = 0; j < step.displayRows[i].length; j++) {
              const cell = step.displayRows[i][j];
              let val = typeof cell === 'object' ? cell.val : cell;
              tableHtml += `<td style="border:1px solid #b583d8; min-width:24px; text-align:center;">${val !== undefined && val !== '' ? val : ''}</td>`;
            }
            tableHtml += `<td style="border:1px solid #b583d8; min-width:24px; text-align:center;">${step.supply[i]}</td></tr>`;
          }
          tableHtml += '<tr><th>Demand</th>';
          for (let j = 0; j < step.demand.length; j++) {
            tableHtml += `<td style="border:1px solid #b583d8; min-width:24px; text-align:center;">${step.demand[j]}</td>`;
          }
          tableHtml += '<td></td></tr>';
          tableHtml += '</table>';
          return `<div style="margin-bottom:18px;"><b>Step ${idx + 1}:</b> Selected Cell: S${step.selected[0]+1}D${step.selected[1]+1}${tableHtml}</div>`;
        }).join("");
        modal.style.display = 'flex';
      };
      outputDiv.appendChild(showHistoryBtn);

      // Change "Next Step" to "Restart" and reload page on click
      nextBtn.textContent = 'Restart';
      nextBtn.onclick = function() {
        window.location.reload();
      };
      nextBtn.disabled = false;
    }
  };
  btnContainer.appendChild(nextBtn);

  // Only append the button container once
  if (!outputDiv.parentNode.querySelector('#steppingStoneStepNav')) {
    outputDiv.parentNode.appendChild(btnContainer);
  }
  renderStep(currentStep);
}