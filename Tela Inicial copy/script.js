document.addEventListener("DOMContentLoaded", function() {
    // Simula o carregamento por 2 segundos
    setTimeout(function() {
        // Oculta a tela de carregamento
        document.getElementById("loading-screen").style.display = "none";
        // Exibe o conteúdo principal
        document.getElementById("content").classList.remove("hidden");
    }, 4000); // Pode ajustar o tempo conforme necessário
});
