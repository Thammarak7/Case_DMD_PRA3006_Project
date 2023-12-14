//For copying codes on the code sections
function copyToClipboard(element) {
  var code = element.parentNode.querySelector("code").textContent;
  navigator.clipboard.writeText(code).then(
    function () {
      element.textContent = "Copied!";
      setTimeout(function () {
        element.textContent = "Copy Code";
      }, 2000);
    },
    function () {
      alert("Copying failed.");
    }
  );
}

// -------------------------------------------------------------------------------//

// SparQL Query Search
var ENDPOINT = "https://chemblmirror.rdf.bigcat-bioinformatics.org/sparql";
var GRAPH = `
  PREFIX chembl: <http://rdf.ebi.ac.uk/terms/chembl#>
  PREFIX target: <http://rdf.ebi.ac.uk/resource/chembl/target/>
        
  SELECT DISTINCT ?target ?targetLabel ?molLabel ?assayLabel ?type ?value ?proteinClassLabel (IF(?type = "Ka", -?value, ?value) AS ?sortValue) WHERE {
    VALUES ?target {target:CHEMBL4523476 target:CHEMBL2093862 target:CHEMBL5742 target:CHEMBL2346486 target:CHEMBL4742325 target:CHEMBL1841 target:CHEMBL3797010 target:CHEMBL2685 target:CHEMBL4184 target:CHEMBL4105919 target:CHEMBL4630889 target:CHEMBL4295656 target:CHEMBL5683 target:CHEMBL4531}
    ?assay  chembl:hasTarget ?target.
 
    ?activity chembl:hasAssay  ?assay.
    ?activity chembl:hasMolecule ?molecule.
  
    ?target rdfs:label ?targetLabel.
    ?molecule rdfs:label ?molLabel.
    ?assay  rdfs:label ?assayLabel.
  
    ?activity chembl:type ?type.
    ?activity chembl:standardValue ?value.
  
    FILTER(?type IN ("Ki", "Ka", "Kd", "Kdiss", "IC50", "EC50"))
  
    OPTIONAL {
      ?target chembl:hasProteinClassification ?proteinClass .
      ?proteinClass rdfs:label ?proteinClassLabel.
    }
  } 
  ORDER BY ASC(?sortValue)
  LIMIT 10000`;

// Function to fetch data from SPARQL endpoint
function sparql(endpoint, query) {
  const url = endpoint + "?query=" + encodeURIComponent(query) + "&format=json";
  return fetch(url);
}

// Function to process data for D3 visualization
function processData(data, maxPerTarget = 100) {
  const nodes = new Map();
  const links = [];
  const targetCount = new Map();
  const preferredTypes = ["Ki", "Kd", "Kdiss", "Ka"];

  data.results.bindings.forEach((binding) => {
    const target = binding.target.value;
    const type = binding.type.value;
    const molecule = binding.molLabel.value;
    const proteinClass = binding.proteinClassLabel.value;

    // Initialize count for the target
    if (!targetCount.has(target)) {
      targetCount.set(target, { count: 0, hasPreferredType: false });
    }

    const targetInfo = targetCount.get(target);

    // Check if the current entry is a preferred type and increment or skip accordingly
    const isPreferredType = preferredTypes.includes(type);
    if (isPreferredType || targetInfo.count < maxPerTarget) {
      if (isPreferredType) {
        targetInfo.hasPreferredType = true;
      }

      // If current entry is not preferred type and we already have preferred type, skip it
      if (!isPreferredType && targetInfo.hasPreferredType) {
        return;
      }

      // Process nodes and links
      if (!nodes.has(target)) {
        nodes.set(target, {
          id: target,
          label: binding.targetLabel.value,
          type: "gene",
        });
      }

      if (!nodes.has(molecule)) {
        nodes.set(molecule, {
          id: molecule,
          label: molecule,
          type: "molecule",
        });
      }

      if (!nodes.has(proteinClass)) {
        nodes.set(proteinClass, {
          id: proteinClass,
          label: proteinClass,
          type: "proteinClass",
        });
      }

      links.push({ source: target, target: molecule });
      links.push({ source: molecule, target: proteinClass });

      // Increment count
      targetInfo.count++;
      targetCount.set(target, targetInfo);
    }
  });

  return { nodes: Array.from(nodes.values()), links };
}

//jQuery
$(document).ready(function () {
  $("#loadData").click(function () {
    sparql(ENDPOINT, GRAPH)
      .then((response) => response.json())
      .then((data) => {
        const maxPerGene = 100;
        const graphData = processData(data, maxPerGene);
        createGraph(graphData);
      })
      .catch((error) => console.error("Error fetching data:", error));
  });
});
