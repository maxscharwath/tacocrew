(() => {


  function getCsrfToken() {

    return document.querySelector("input[name=\"csrf_token\"]").value;
  }
  var orderStatusRefreshIntervalId;
  window.addEventListener("scroll", function() {

    var whatsappIcon = document.querySelector(".whatsapp-icon");
    window.scrollY > 50 && (document.querySelector(".header").classList.add("shrink"), whatsappIcon.style.display = 'block');
  }), $(document).ready(function() {

    $(".modal").on("hidden.bs.modal", function() {

      $(".modal-backdrop").remove(), $("body").css({
        'overflow': '',
        'padding-right': ''
      });
    });
  }), document.querySelectorAll('.accordion-button').forEach(accordionButton => {

    accordionButton.addEventListener("click", function() {
      const isCollapsed = accordionButton.classList.contains("collapsed"),
        iconElement = accordionButton.querySelector("i.fas");
      (document.querySelectorAll(".accordion-button i.fas").forEach(icon => {

        icon.classList.remove("fa-minus"), icon.classList.add("fa-plus");
      }), isCollapsed ? (iconElement.classList.remove("fa-minus"), iconElement.classList.add("fa-plus")) : (iconElement.classList.remove('fa-plus'), iconElement.classList.add("fa-minus")), !isCollapsed) && document.querySelector(accordionButton.dataset.bsTarget).addEventListener("shown.bs.collapse", function() {
        const headerHeight = document.querySelector(".header").offsetHeight,
          scrollPosition = accordionButton.getBoundingClientRect().top + window.scrollY - headerHeight - 20;
        window.scrollTo({
          'top': scrollPosition,
          'behavior': "smooth"
        });
      }, {
        'once': true
      });
    });
  }), setInterval(function() {

    fetch("ajax/refresh_token.php", {
      'method': "GET",
      'credentials': "same-origin"
    }).then(tokenResponse => {

      if (!tokenResponse.ok) throw 403 === tokenResponse.status && console.log("REFRESH TOKEN ERROR"), new Error('REFRESH TOKEN Network response was not ok');
      return tokenResponse.json();
    }).then(tokenData => {

      tokenData.csrf_token && (document.querySelector("input[name=\"csrf_token\"]").value = tokenData.csrf_token);
    }).catch(tokenError => console.error("Token yenileme hatas\u0131:", tokenError));
  }, 1800000), document.addEventListener("DOMContentLoaded", function() {
    refreshOrderHistory();
  });

  function refreshOrderHistory() {

    var orderHistoryElement = document.getElementById("orderHistory"),
      orderStories = JSON.parse(localStorage.getItem("order_stories") || '[]'),
      csrfToken = getCsrfToken();
    fetch("ajax/oh.php", {
      'method': "POST",
      'headers': {
        'Content-Type': "application/json",
        'X-CSRF-Token': csrfToken
      },
      'body': JSON.stringify({
        'orders': orderStories.map(order => ({
          'orderId': order.orderId
        }))
      })
    }).then(response => {

      if (!response.ok) throw 403 === response.status && window.location.reload(), new Error("OH Network response was not ok");
      return response.json();
    }).then(orderStatuses => {

      Array.isArray(orderStatuses) || (orderStatuses = []);
      let hasStatusChanged = false;
      orderStatuses.forEach(orderStatus => {
        const orderIndex = orderStories.findIndex(orderItem => orderItem.orderId === orderStatus.orderId); - 1 !== orderIndex && orderStories[orderIndex].OrderData.status !== orderStatus.status && (orderStories[orderIndex].OrderData.status = orderStatus.status, hasStatusChanged = true);
      }), orderHistoryElement.innerHTML = '', orderStories.sort((orderA, orderB) => new Date(orderB.OrderData.date) - new Date(orderA.OrderData.date)), orderStories = orderStories.slice(0, 3);
      let hasActiveOrders = false;
      orderStories.forEach(orderData => {

        new Date(orderData.OrderData.date).toDateString() === new Date().toDateString() || 'pending' !== orderData.OrderData.status && "confirmed" !== orderData.OrderData.status && "ondelivery" !== orderData.OrderData.status ? "pending" !== orderData.OrderData.status && 'confirmed' !== orderData.OrderData.status && 'ondelivery' !== orderData.OrderData.status || (hasActiveOrders = true) : orderData.OrderData.status = 'delivered';
        const orderCard = function(orderData) {
          const orderItemsHtml = function(order) {
              let itemsHtml = "<ul class=\"list-group list-group-flush\">";
              return itemsHtml += buildOrderItemsList(order.tacos, "Tacos"), itemsHtml += buildOrderItemsList(order.extras, 'Extras'), itemsHtml += buildOrderItemsList(order.boissons, "Boissons"), itemsHtml += buildOrderItemsList(order.desserts, 'Desserts'), itemsHtml += '</ul>', itemsHtml;
            }(orderData);
            const orderCard = document.createElement("div");
          orderCard.className = "card border-" + getStatusVariant(orderData.OrderData.status) + ' bg-light-subtle border border-' + getStatusVariant(orderData.OrderData.status), orderCard.setAttribute("data-order-id", orderData.orderId);
          const currentHour = new Date().getHours(),
            currentMinute = new Date().getMinutes(),
            currentDay = new Date().getDay(),
            isBusinessHours = 10 === currentHour && currentMinute >= 0 || 5 === currentDay && 22 === currentHour && currentMinute <= 50 || 0 === currentDay && 22 === currentHour && currentMinute <= 50 || 5 !== currentDay && 0 !== currentDay && 21 === currentHour && currentMinute <= 50 || currentHour > 10 && currentHour < 21;
          let canRepeatOrder = "pending" !== orderData.OrderData.status && "confirmed" !== orderData.OrderData.status && 'ondelivery' !== orderData.OrderData.status && "cancelled" !== orderData.OrderData.status;
          return canRepeatOrder = canRepeatOrder && isBusinessHours, orderCard.innerHTML = "<div class="card-body"><h5 class="card-title">" + function(orderStatus, orderType) {

            switch (orderStatus) {
              case "pending":
                return "En attente de confirmation.";
              case "confirmed":
                return "emporter" === orderType ? 'Confirmé pour retrait.' : 'Confirmé.';
              case "ondelivery":
                return "En route.";
              case "delivered":
                return "Livré.";
              case "cancelled":
                return 'Annulé.';
              default:
                return "État inconnu.";
            }
          }(orderData.OrderData.status, orderData.OrderData.type) + '
' + (canRepeatOrder ? "<button class="btn btn-sm btn-primary repeat-order-btn" onclick="repeatOrder(" + orderData.orderId + ")">Répéter la commande</button>" : "") + "</h5>" + ("pending" === orderData.OrderData.status ? "<div class="alert alert-" + getStatusVariant(orderData.OrderData.status) + '-subtle text-danger rounded opacity-75">Votre commande est en cours de confirmation. Les commandes passées pendant les heures ouvrables sont confirmées en quelques secondes.</div>' : '') + '
' + ('confirmed' === orderData.OrderData.status ? '<div class="p-2 mb-2 bg-' + getStatusVariant(orderData.OrderData.status) + "-subtle"><strong>" + function(deliveryType) {

            return 'emporter' === deliveryType ? "pour retrait" : "pour livraison";
          }(orderData.OrderData.type) + '</div>' : '') + '
' + ("ondelivery" === orderData.OrderData.status ? "<div class="alert alert-" + getStatusVariant(orderData.OrderData.status) + "-subtle">En route.</div>" : '') + '
' + ("cancelled" === orderData.OrderData.status ? "<div class="alert alert-" + getStatusVariant(orderData.OrderData.status) + "-subtle">Livré.</div>" : '') + '
<p class='card-title text-end'>Date de commande: ' + orderData.OrderData.date + "</p>" + ("emporter" === orderData.OrderData.type ? "<p class="card-subtitle text-end text-muted">Heure de retrait demandée: " : "") + "</p>" + (orderData.OrderData.requestedFor ? "<p class="card-subtitle text-end text-muted">Heure de livraison demandée: " + orderData.OrderData.requestedFor + "</p>" : '') + '
' + orderItemsHtml + '
' + ("livraison" === orderData.OrderData.type ? '<p class='card-subtitle text-end text-muted'>Frais de livraison: 2.00 CHF</p>' : '') + "<p class="card-text text-end"><strong>Total: " + orderData.OrderData.price + ' CHF</p>
' + ('emporter' === orderData.OrderData.type && "delivered" !== orderData.OrderData.status ? "<button class="btn btn-sm btn-warning repeat-order-btn" onclick="repeatOrder(" : '') + '
</div>
', orderCard;
        }(orderData);
        orderHistoryElement.appendChild(orderCard);
      }), hasActiveOrders && !orderStatusRefreshIntervalId ? orderStatusRefreshIntervalId = setInterval(refreshOrderHistory, 15000) : !hasActiveOrders && orderStatusRefreshIntervalId && (clearInterval(orderStatusRefreshIntervalId), orderStatusRefreshIntervalId = null), localStorage.setItem("order_stories", JSON.stringify(orderStories)), orderStories;
    }).catch(fetchError => {

      console.error("Fetch Error:", fetchError);
    });
  }

  function buildOrderItemsList(items, sectionLabel) {

    let renderedItems = '';
    "object" != typeof items || null === items || Array.isArray(items) || (items = Object.values(items));
    return Array.isArray(items) && items.forEach(item => {

      let extraDetails = '';
      switch (sectionLabel) {
        case 'Tacos':
          extraDetails = "<br><strong>- Viande(s):</strong> <em>" + item.viande.map(meat => {
            const quantityLabel = meat.quantity && meat.quantity > 1 ? ' x' + meat.quantity : '';
            return meat.name + quantityLabel;
          }).join(', ') + ' </em> <br>- <strong>Garnitures:</strong><em> ' + item.garniture.map(garnish => garnish.name).join(', ') + ' </em> <br>- <strong>Sauces:</strong><em> ' + item.sauce.map(sauce => sauce.name).join(', ') + " </em>", item.tacosNote && (extraDetails += '<br>- <strong>Remarque:</strong> <em>' + item.tacosNote + "</em>");
          break;
        case 'Extras': {
          let freeSauceDetails = '';
          if (item.free_sauces && Array.isArray(item.free_sauces) && item.free_sauces.length > 0) {
            const sauceNames = item.free_sauces.filter(sauce => sauce.name).map(sauce => sauce.name);
            sauceNames.length > 0 && (freeSauceDetails = "<br>- <strong>Sauces offertes:</strong> <em>" + sauceNames.join(', ') + "</em>");
          } else item.free_sauce && item.free_sauce.name && (freeSauceDetails = "<br>- <strong>Sauce offerte:</strong> <em>" + item.free_sauce.name + "</em>");
          extraDetails = freeSauceDetails;
          break;
        }
        default:
          extraDetails = '';
      }
      renderedItems += "<li class='list-group-item'>\n  <span class=\"border rounded py-1 px-2\">" + item.quantity + "</span> x " + item.name + ' - ' + item.price + ' CHF ' + extraDetails + "\n  </li>";
    }), renderedItems;
  }

  function getStatusVariant(status) {

    switch (status) {
      case "pending":
      default:
        return "danger";
      case "confirmed":
      case "ondelivery":
        return 'success';
      case "delivered":
        return "secondary";
      case "cancelled":
        return 'light-subtle';
    }
  }
  window.repeatOrder = function(orderId) {
    const foundOrder = JSON.parse(localStorage.getItem("order_stories")).find(orderItem => orderItem.orderId == orderId);
    if (!foundOrder) return void alert("Order not found.");
    const csrfToken = getCsrfToken(),
      repeatButton = document.querySelector("button[onclick='repeatOrder(" + orderId + ")']");
    repeatButton.disabled = true, fetch('ajax/restore_order.php', {
      'method': "POST",
      'headers': {
        'X-CSRF-Token': csrfToken
      },
      'body': JSON.stringify({
        'order': foundOrder
      })
    }).then(restoreResponse => {

      if (!restoreResponse.ok) throw 403 === restoreResponse.status && alert("RESTORE ORDER REFRESH"), new Error("RESTORE ORDER Network response was not ok");
      return restoreResponse.json();
    }).then(restoreResult => {

      if ("success" === restoreResult.status || 'warning' === restoreResult.status) {
        const successModal = new bootstrap.Modal(document.getElementById("successModal")),
          modalBody = document.getElementById('successModalBody');
        if ("warning" === restoreResult.status) {
          let warningHtml = '';
          restoreResult.out_of_stock_items && restoreResult.out_of_stock_items.length > 0 && (warningHtml = '<div class="alert alert-warning text-start mx-auto" style="max-width: 500px; background-color: #fff3cd; border-left: 4px solid #ffc107;"><ul style="list-style: none; padding-left: 0; margin-bottom: 0;">', restoreResult.out_of_stock_items.forEach(function(outOfStockItem) {

            warningHtml += '<li style="padding: 8px 0; border-bottom: 1px solid #ffeaa7;"><i class="fa fa-times-circle text-danger me-2"></i><strong>' + outOfStockItem + "</strong></li>";
          }), warningHtml += "</ul></div>"), modalBody.innerHTML = '<div class="text-center" style="padding: 20px;"><div class="d-flex justify-content-center align-items-center mb-4" style="height: 100px;"><div style="width: 100px; height: 100px; border-radius: 50%; background: linear-gradient(135deg, #ffeaa7 0%, #fdcb6e 100%); display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 15px rgba(253, 203, 110, 0.4);"><i class="fa fa-exclamation-triangle" style="color: #fff; font-size: 50px;"></i></div></div><h4 class="mb-3" style="color: #e17055; font-weight: 600;">Certains produits ne sont pas disponibles</h4><p class="mb-4" style="color: #636e72; font-size: 15px;">Les produits suivants ne sont temporairement pas disponibles et n'ont pas été ajoutés à votre panier:</p>' + warningHtml + "<div class=\"alert alert-success mx-auto mt-4\" style=\"max-width: 500px; background-color: #d4edda; border-left: 4px solid #28a745;\"><i class=\"fa fa-check-circle text-success me-2\"></i>Les autres produits ont \u00e9t\u00e9 ajout\u00e9s avec succ\u00e8s.</div><button id=\"continueButton\" class=\"btn btn-danger mt-3\" style=\"min-width: 200px; padding: 12px 24px; font-size: 16px; border-radius: 25px; box-shadow: 0 4px 15px rgba(220, 53, 69, 0.3);\">Continuer vers le panier</button></div>", successModal.show(), document.getElementById("continueButton").addEventListener("click", function() {

            successModal.hide(), localStorage.setItem("openOrderModal", "true"), window.location.reload();
          });
        } else {
          modalBody.innerHTML = "\n            <div class=\"d-flex justify-content-center align-items-center\" style=\"height: 100px;\">\n              <i class=\"fa fa-check-circle\" style=\"color: green; font-size: 50px;\"></i>\n            </div>\n            Les produits sont \u00e0 nouveau ajout\u00e9s \u00e0 votre panier. <br />\n            La page sera actualis\u00e9e dans <span id=\"countdown\">3</span> secondes.\n          ", successModal.show();
          let countdown = 3;
          const countdownElement = document.getElementById('countdown'),
            countdownInterval = setInterval(() => {
              countdown--, countdownElement.textContent = countdown, 0 === countdown && (clearInterval(countdownInterval), successModal.hide(), localStorage.setItem('openOrderModal', "true"), window.location.reload());
            }, 1000);
        }
      } else alert("Error during repeat order. Please try again later."), repeatButton.disabled = false;
    }).catch(error => {

      console.error('Error:', error), alert("Error during repeat order. Please try again later."), repeatButton.disabled = false;
    });
  }, document.addEventListener("DOMContentLoaded", function() {

    if ("true" === localStorage.getItem('openOrderModal')) {
      localStorage.removeItem('openOrderModal'), new bootstrap[("Modal")](document.getElementById('orderModal')).show();
      var csrfToken = getCsrfToken();
      fetch("ajax/os.php", {
        'method': "POST",
        'headers': {
          'Content-Type': "application/x-www-form-urlencoded"
        },
        'body': 'csrf_token=' + encodeURIComponent(csrfToken)
      }).then(orderSummaryResponse => {

        if (!orderSummaryResponse.ok) throw 403 === orderSummaryResponse.status && console.log("OS REFRESH"), new Error("Network response was not ok");
        return orderSummaryResponse.text();
      }).then(orderSummaryHtml => {

        document.querySelector("#orderModal .order-summary").innerHTML = orderSummaryHtml;
      }).catch(error => console.error("Error loading the order summary:", error));
    }
  }), document.querySelectorAll(".accordion-button").forEach(accordionButton => {

    accordionButton.addEventListener("click", function() {
      const targetSection = this.dataset.bsTarget,
        accordionState = {
          'activeSection': this.classList.contains("collapsed") ? null : targetSection,
          'timestamp': new Date().getTime()
        };
      localStorage.setItem("accordionState", JSON.stringify(accordionState));
    });
  }), document.addEventListener('DOMContentLoaded', function() {
    const storedState = localStorage.getItem("accordionState");
    if (storedState) {
      const {
        activeSection: activeSection,
        timestamp: timestamp
      } = JSON.parse(storedState);
      if (new Date().getTime() - timestamp < 3600000 && activeSection) {
        const targetElement = document.querySelector(activeSection);
        targetElement && new bootstrap.Collapse(targetElement, {
          'toggle': false
        }).show();
      } else localStorage.removeItem("accordionState");
    }
  }), document.addEventListener("DOMContentLoaded", function() {

    document.body.addEventListener("click", function(event) {

      event.target.matches(".increase-quantity") && sendTacoQuantityUpdate('increaseQuantity', event.target.dataset.index), event.target.matches(".decrease-quantity") && sendTacoQuantityUpdate('decreaseQuantity', event.target.dataset.index);
    });
  });
  var meatCheckboxes, sauceCheckboxes, garnishCheckboxes, tacoQuantityCsrfToken = getCsrfToken();

  function sendTacoQuantityUpdate(action, tacoIndex) {

    const request = new XMLHttpRequest();
    request.open("POST", "ajax/owt.php", true);
    request.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    request.setRequestHeader('X-CSRF-Token', tacoQuantityCsrfToken);
    request.const onload = function() {

      if (200 === request.status) {
        refreshTacoListUI();
        const response = JSON.parse(this.responseText);
        if ("success" === response.status) {
          const quantityInput = document.querySelector("#tacos-" + tacoIndex + ' .quantity-input');
          quantityInput ? (quantityInput.value = response.quantity, refreshCartSummary()) : console.error("Quantity input not found for index: " + tacoIndex);
        } else alert("Error during processing.");
      } else console.error("Request failed with status " + request.status + ': ' + request.statusText);
    };
    request.send("action=" + action + '&index=' + tacoIndex);
  }

  function applyEditSelectionLimits(selectedTacoSize) {

    [...meatCheckboxes, ...sauceCheckboxes].forEach(input => input.disabled = false);
    let maxAllowedMeats = 0;
    switch (selectedTacoSize) {
      case "tacos_L":
        maxAllowedMeats = 1;
        break;
      case "tacos_BOWL":
        maxAllowedMeats = 2;
        break;
      case 'tacos_L_mixte':
      case "tacos_XL":
        maxAllowedMeats = 3;
        break;
      case "tacos_XXL":
        maxAllowedMeats = 4;
        break;
      case "tacos_GIGA":
        maxAllowedMeats = 5;
        break;
      default:
        [...meatCheckboxes, ...sauceCheckboxes].forEach(input => input.disabled = true);
        return;
    }
    (function(meatLimit) {

      let currentlySelectedMeats = [...meatCheckboxes].filter(checkbox => checkbox.checked).length;
      meatCheckboxes.forEach(checkbox => {

        checkbox.disabled = currentlySelectedMeats >= meatLimit && !checkbox.checked;
      }), meatCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', () => {

          let updatedSelectedMeats = [...meatCheckboxes].filter(meatInput => meatInput.checked).length;
          meatCheckboxes.forEach(meatInput => {

            meatInput.disabled = updatedSelectedMeats >= meatLimit && !meatInput.checked;
          });
        });
      });
    })(maxAllowedMeats),
    function(sauceLimit) {

      let selectedSauceCount = [...sauceCheckboxes].filter(checkbox => checkbox.checked).length;
      sauceCheckboxes.forEach(checkbox => {

        checkbox.disabled = selectedSauceCount >= sauceLimit && !checkbox.checked;
      }), sauceCheckboxes.forEach(checkbox => {

        checkbox.addEventListener('change', () => {

          let updatedSauceCount = [...sauceCheckboxes].filter(sauceInput => sauceInput.checked).length;
          sauceCheckboxes.forEach(sauceInput => {

            sauceInput.disabled = updatedSauceCount >= sauceLimit && !sauceInput.checked;
          });
        });
      });
    }(3);
  }

  function submitExtraSelection(extraId, extraName, extraPrice, extraQuantity, freeSauceId = null, freeSauceName = '', freeSauces = null) {

    var csrfToken = getCsrfToken();
    const extraData = {
      'id': extraId,
      'name': extraName,
      'price': extraPrice,
      'quantity': extraQuantity,
      'free_sauce': freeSauceId ? {
        'id': freeSauceId,
        'name': freeSauceName,
        'price': 0
      } : void 0,
      'free_sauces': freeSauces
    };
    fetch("ajax/ues.php", {
      'method': "POST",
      'headers': {
        'X-CSRF-Token': csrfToken
      },
      'body': JSON.stringify(extraData)
    }).then(response => response.json()).then(result => {
      refreshCartSummary();
    }).catch(error => console.error("Error:", error));
  }

  function refreshCategoryBadges() {

    const csrfToken = getCsrfToken();
    fetch("ajax/sd.php", {
      'method': "POST",
      'headers': {
        'X-CSRF-Token': csrfToken
      }
    }).then(response => {

      if (!response.ok) throw 403 === response.status && console.log('SD REFRESH'), new Error('Network response was not ok');
      return response.json();
    }).then(categorySummary => {

      Object.entries(categorySummary).forEach(([categoryKey, summary]) => {
        const totalQuantity = summary.totalQuantity,
          totalPrice = summary.totalPrice;
        let sectionId;
        switch (categoryKey) {
          case 'tacos':
            sectionId = "createTacos";
            break;
          case "extras":
            sectionId = "selectSnacks";
            break;
          case 'boissons':
            sectionId = 'selectDrinks';
            break;
          case 'desserts':
            sectionId = 'selectDesserts';
            break;
          default:
            console.error("Unknown category:", categoryKey);
            return;
        }
        const badge = document.querySelector('#' + sectionId + " .accordion-button .badge");
        if (badge) {
          if (totalQuantity > 0) {
            const productLabel = totalQuantity > 1 ? "produits" : "produit";
            badge.textContent = totalQuantity + ' ' + productLabel + " total " + totalPrice + "CHF", badge.style.display = '';
          } else badge.style.display = "none";
        }
      });
    }).catch(error => console.error("Error:", error));
  }

  function refreshCartSummary() {

    const csrfToken = getCsrfToken();
    fetch('ajax/cs.php', {
      'method': "POST",
      'headers': {
        'Content-Type': "application/x-www-form-urlencoded",
        'X-CSRF-Token': csrfToken
      }
    }).then(response => {

      if (!response.ok) throw 403 === response.status && console.log("CS REFRESH"), new Error("CS Network response was not ok");
      return response.json();
    }).then(payload => {

      document.getElementById("cart-summary").innerHTML = payload.message, refreshCategoryBadges();
    }).catch(error => console.error("Hata:", error));
  }

  function toggleTacoOptionsBySize(tacoSize, prefix) {

    var standardMeats = ["viande_hachee", "escalope_de_poulet", 'merguez', "soudjouk", "falafel_vegetarien", "sans_viande"],
      premiumMeats = ["cordon_bleu", "nuggets", "tenders", "kebab_agneau"],
      restrictedItems = ['cheddar', "gruyere", "frites"];
    'tacos_BOWL' === tacoSize ? (standardMeats.concat(premiumMeats).forEach(function(meatType) {
      const meatInput = document.querySelector("input[name=\"viande[]\"][value=\"" + meatType + '"]');
      meatInput && !meatInput.checked && (meatInput.disabled = false);
    }), standardMeats.concat(premiumMeats).forEach(function(meatId) {

      document.getElementById(prefix + meatId + "_div").style.display = "block";
    }), restrictedItems.forEach(function(restrictedId) {

      document.getElementById(prefix + restrictedId + '_div').style.display = 'none';
    }), document.getElementById(prefix + "frites_note").style.display = "block") : (standardMeats.concat(premiumMeats).forEach(function(meatSlug) {

      document.getElementById(prefix + meatSlug + "_div").style.display = "block";
    }), restrictedItems.forEach(function(restrictedSlug) {

      document.getElementById(prefix + restrictedSlug + "_div").style.display = "block";
    }), document.getElementById(prefix + "frites_note").style.display = 'none');
  }

  function resetTacoForm() {

    document.getElementById('tacosForm').reset(), [...meatCheckboxes, ...sauceCheckboxes, ...garnishCheckboxes].forEach(checkbox => {

      checkbox.checked = false, checkbox.disabled = false;
    });
  }

  function refreshTacoListUI() {

    0 === $("#products-list").children().length ? ($('#product-messages').html("<p class=\"fst-italic\">Veuillez commencer par choisir la taille de vos tacos.</p>"), $("div:contains(\"Tacos dans votre panier\")").remove()) : $("#product-messages").html('<div class="bg-danger rounded text-light p-2" role="alert"><i class="fa-solid fa-chevron-down"></i> Tacos dans votre panier</div>'), $("#products-list .card").each(function(index) {

      $(this).attr('id', 'tacos-' + index), $(this).attr("data-index", index), $(this).find(".delete-tacos").attr("data-index", index);
    });
  }

  function loadExistingTacos() {

    var csrfToken = getCsrfToken();
    $.ajax({
      'type': "POST",
      'url': "ajax/owt.php",
      'headers': {
        'X-CSRF-Token': csrfToken
      },
      'data': {
        'loadProducts': true
      },
      'success': function(html) {

        $("#products-list").html(html), refreshTacoListUI(), refreshCartSummary();
      },
      'error': function() {

        location.reload();
      }
    });
  }
  document.addEventListener("DOMContentLoaded", function() {

    document.getElementById("orderAccordion").addEventListener("click", function(event) {
      const editButton = event.target.closest('.edit-tacos');
      if (editButton) {
        event.preventDefault();
        const tacoIndex = editButton.getAttribute('data-index'),
          csrfToken = getCsrfToken();
        document.getElementById('editIndex').value = tacoIndex, fetch("ajax/gtd.php", {
          'method': "POST",
          'headers': {
            'X-CSRF-Token': csrfToken,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          'body': "index=" + tacoIndex
        }).then(response => {

          if (!response.ok) throw 403 === response.status && console.log("GTD REFRESH"), new Error("GTD Network response was not ok");
          return response.json();
        }).then(data => {

          if ("success" === data.status) {
            const {
              taille: tacoSize,
              viande: meats,
              garniture: garnitures,
              sauce: sauces,
              tacosNote: tacosNote
            } = data.data;
            console.log('Loaded tacos data:', data.data), console.log("Viande data:", meats), document.getElementById("editSelectProduct").value = tacoSize, document.getElementById("editTaille").value = tacoSize, document.getElementById("editTacosNote").value = tacosNote, document.querySelectorAll("#tacosEditForm input[type=\"checkbox\"]").forEach(checkbox => {

                checkbox.checked = false;
              }),
              function(meats, garnitures, sauces, tacoSize) {

                document.querySelectorAll("#tacosEditForm input[type=\"checkbox\"]").forEach(checkbox => {

                  checkbox.checked = false, checkbox.disabled = false;
                }), document.querySelectorAll("#tacosEditForm .meat-quantity-control").forEach(quantityControl => {

                  quantityControl.classList.add("d-none");
                  const quantityInput = quantityControl.querySelector('.meat-quantity-input');
                  quantityInput && (quantityInput.value = 1, quantityInput.disabled = true);
                });
                let maxMeats = 1;
                switch (tacoSize) {
                  case "tacos_L":
                    maxMeats = 1;
                    break;
                  case "tacos_L_mixte":
                  case "tacos_XL":
                    maxMeats = 3;
                    break;
                  case 'tacos_XXL':
                    maxMeats = 4;
                    break;
                  case "tacos_GIGA":
                    maxMeats = 5;
                }
                meats.forEach(meat => {
                  const meatCheckbox = document.querySelector('#tacosEditForm input[name="viande[]"][value="' + meat.slug + '"]');
                  if (meatCheckbox && (meatCheckbox.checked = true, maxMeats > 1)) {
                    const meatRow = meatCheckbox.closest(".meat-selection-row");
                    if (meatRow) {
                      const quantityControl = meatRow.querySelector(".meat-quantity-control"),
                        quantityInput = meatRow.querySelector(".meat-quantity-input");
                      quantityControl && quantityInput && (quantityControl.classList.remove("d-none"), quantityInput.value = meat.quantity || 1, quantityInput.disabled = false);
                    }
                  }
                }), garnitures.forEach(garniture => {
                  const garnitureCheckbox = document.querySelector("#tacosEditForm input[name=\"garniture[]\"][value=\"" + garniture.slug + '"]');
                  garnitureCheckbox && (garnitureCheckbox.checked = true);
                }), sauces.forEach(sauce => {
                  const sauceCheckbox = document.querySelector('#tacosEditForm input[name="sauce[]"][value="' + sauce.slug + '"]');
                  sauceCheckbox && (sauceCheckbox.checked = true);
                }), applyEditSelectionLimits(tacoSize);
              }(meats, garnitures, sauces, tacoSize), new bootstrap[("Modal")](document.getElementById("tacosEditModal")).show();
          } else console.error("Failed to fetch tacos details:", data.message), console.log("Connection error. Please refresh the page.");
        }).catch(error => console.error('Error:', error));
      }
    });
  }), document.addEventListener("DOMContentLoaded", function() {

    document.getElementById('tacosEditForm').addEventListener('submit', function(event) {

      event.preventDefault();
      const selectedTacoSize = document.getElementById("editSelectProduct").value,
        selectedMeats = document.querySelectorAll("#tacosEditForm input[name=\"viande[]\"]:checked"),
        selectedSauces = document.querySelectorAll("#tacosEditForm input[name=\"sauce[]\"]:checked"),
        selectedGarnitures = document.querySelectorAll("#tacosEditForm input[name=\"garniture[]\"]:checked");
      if (0 === selectedMeats.length) return alert("Veuillez s\u00e9lectionner au moins une viande ou cocher \"sans viande\"."), false;
      if (0 === selectedSauces.length) return alert("Veuillez s\u00e9lectionner au moins une sauce ou cocher \"sans sauce\"."), false;
      if ("tacos_BOWL" !== selectedTacoSize && 0 === selectedGarnitures.length) return alert('Veuillez sélectionner au moins une garniture ou cocher "sans garniture".'), false;
      var formData = new FormData(this);
      selectedMeats.forEach(meatCheckbox => {
        const meatValue = meatCheckbox.value,
          meatRow = meatCheckbox.closest(".meat-selection-row"),
          quantityInput = meatRow ? meatRow.querySelector(".meat-quantity-input") : null,
          quantity = quantityInput && parseInt(quantityInput.value, 10) || 1;
        formData.append("meat_quantity[" + meatValue + ']', quantity);
      });
      var csrfToken = getCsrfToken();
      fetch("ajax/et.php", {
        'method': 'POST',
        'headers': {
          'X-CSRF-Token': csrfToken
        },
        'body': formData
      }).then(response => {

        if (!response.ok) throw new Error("ET Network response was not ok");
        return response.text();
      }).then(html => {

        $("#tacosEditModal").modal("hide"), loadExistingTacos(), refreshTacoListUI(), refreshCartSummary();
      }).catch(error => console.error("Error:", error));
    });
  }), document.addEventListener("DOMContentLoaded", function() {
    const extraCheckboxes = document.querySelectorAll("input[name=\"extras\"]"),
      csrfToken = getCsrfToken();
    fetch("ajax/gse.php", {
      'method': 'POST',
      'headers': {
        'X-CSRF-Token': csrfToken
      }
    }).then(response => {

      if (!response.ok) throw 403 === response.status && console.log("GSE REFRESH"), new Error("GSE Network response was not ok");
      return response.json();
    }).then(selectedExtras => {

      Object.values(selectedExtras).forEach(extra => {
        const extraCheckbox = document.getElementById(extra.id);
        if (extraCheckbox) {
          extraCheckbox.checked = true;
          const quantityControl = extraCheckbox.closest(".form-check").querySelector(".extras-quantity-control");
          quantityControl.classList.remove("d-none"), quantityControl.querySelector(".quantity-input").value = extra.quantity;
          const freeSauceContainer = document.getElementById("free_sauce_select_" + extra.id);
          if (freeSauceContainer) {
            if (freeSauceContainer.classList.remove('d-none'), extra.free_sauces && Array.isArray(extra.free_sauces)) freeSauceContainer.querySelectorAll('select').forEach((select, index) => {

              extra.free_sauces[index] && extra.free_sauces[index].id && (select.value = extra.free_sauces[index].id);
            });
            else {
              if (extra.free_sauce && extra.free_sauce.id) {
                const select = freeSauceContainer.querySelector("select");
                select && (select.value = extra.free_sauce.id);
              }
            }
          }
        }
      });
    }).catch(error => console.error("Error:", error)), (document.querySelectorAll(".free-sauces-container").forEach(freeSauceContainer => {
      const extraId = freeSauceContainer.id.replace('free_sauce_select_', ''),
        extraCheckbox = document.getElementById(extraId);
      extraCheckbox && extraCheckbox.checked || freeSauceContainer.classList.add("d-none");
    }), extraCheckboxes.forEach(extraCheckbox => {

      extraCheckbox.addEventListener("change", function() {
        const quantityControl = this.closest(".form-check").querySelector('.extras-quantity-control'),
          freeSauceContainer = document.getElementById("free_sauce_select_" + this.id);
        this.checked ? (quantityControl.classList.remove("d-none"), freeSauceContainer && freeSauceContainer.classList.remove("d-none")) : (quantityControl.classList.add('d-none'), quantityControl.querySelector(".quantity-input").value = 1, freeSauceContainer && (freeSauceContainer.classList.add("d-none"), freeSauceContainer.querySelectorAll("select").forEach(select => {

          select.value = '';
        })));
        const isChecked = this.checked,
          quantity = isChecked ? parseInt(quantityControl.querySelector(".quantity-input").value, 10) : 0,
          extraId = this.id,
          extraValue = this.getAttribute("value"),
          priceText = this.closest(".form-check").querySelector(".extras-info").textContent,
          price = parseFloat(priceText.replace("CHF ", '')) || 0.5;
        ['extra_frites', "extra_nuggets", "extra_falafel", "extra_tenders", 'extra_onion_rings', "extra_pommes_gaufrettes", 'extra_mozarella_sticks', "extra_potatoes", 'extra_gaufrettes'].includes(extraId) && freeSauceContainer && isChecked ? submitExtraSelectionWithSauces(extraId) : submitExtraSelection(extraId, extraValue, price, quantity);
      });
    }), document.querySelectorAll('.free-sauces-container select').forEach(select => {
      select.addEventListener('change', handleFreeSauceSelectionChange);
    }), document.querySelectorAll(".extras-quantity-control .increase, .extras-quantity-control .decrease").forEach(button => {

      button.addEventListener("click", function() {
        const quantityInput = button.closest('.extras-quantity-control').querySelector(".quantity-input");
        let quantity = parseInt(quantityInput.value, 10);
        const extraCheckbox = button.closest(".form-check").querySelector(".extra-checkbox"),
          extraId = extraCheckbox.id,
          extraValue = extraCheckbox.getAttribute("value"),
          priceText = extraCheckbox.closest(".form-check").querySelector('.extras-info').textContent,
          price = parseFloat(priceText.replace("CHF ", '')) || 0.5;
        button.classList.contains('increase') ? quantity++ : quantity > 1 && quantity--, quantityInput.value = quantity, ["extra_frites", "extra_nuggets", "extra_falafel", 'extra_tenders', "extra_onion_rings", "extra_pommes_gaufrettes", "extra_mozarella_sticks", "extra_potatoes", "extra_gaufrettes"].includes(extraId) ? (! function(extraId, quantity) {
          const isDevMode = "localhost" === window.location.hostname || "127.0.0.1" === window.location.hostname;
          isDevMode && console.log("updateFreeSauceOptions called with:", extraId, quantity);
          const freeSauceContainer = document.getElementById('free_sauce_select_' + extraId);
          if (!freeSauceContainer) return void(isDevMode && console.log("No container found for:", 'free_sauce_select_' + extraId));
          const selects = freeSauceContainer.querySelectorAll("select"),
            savedSelections = [];
          selects.forEach(select => {

            select.value && savedSelections.push(select.value);
          }), isDevMode && console.log("Saved selections:", savedSelections), (freeSauceContainer.innerHTML = '', isDevMode && console.log("Creating", quantity, 'sauce options'));
          for (let index = 1; index <= quantity; index++) {
            const sauceItem = document.createElement("div");
            sauceItem.className = "free-sauce-item d-flex flex-column flex-sm-row align-items-start align-items-sm-center mb-2 mt-1";
            const savedValue = savedSelections[index - 1] || '';
            let optionsHtml = "<option value=\"\" disabled>Choisissez votre sauce offerte ici.</option>";
            window.availableSauces && Array.isArray(window.availableSauces) && (optionsHtml = '<option value="" disabled ' + (savedValue ? '' : "selected") + ">Choisissez votre sauce offerte ici.</option>", window.availableSauces.forEach(sauce => {
              const selected = savedValue === sauce.id ? "selected" : '';
              optionsHtml += "<option value=\"" + sauce.id + '" ' + selected + '>' + sauce.name + '</option>';
            })), sauceItem.innerHTML = "\n      <i class=\"fa-solid fa-angles-up\" style=\"font-size: 22px; margin-right: 8px; color:#dc3545\"></i>\n      <span class=\"text-danger me-2\">" + index + ".</span>\n      <select class=\"form-control text-danger form-select-sm\" name=\"free_sauce_" + extraId + "[]\" data-item-index=\"" + index + '">
        ' + optionsHtml + "\n      </select>\n    ", freeSauceContainer.appendChild(sauceItem);
          }
          isDevMode && console.log("Created", quantity, "sauce options for", extraId), ! function(extraId) {
            const selects = document.querySelectorAll("#free_sauce_select_" + extraId + " select");
            selects.forEach(select => {

              select.removeEventListener("change", handleFreeSauceSelectionChange), select.addEventListener("change", handleFreeSauceSelectionChange);
            });
          }(extraId);
        }(extraId, quantity), submitExtraSelectionWithSauces(extraId)) : submitExtraSelection(extraId, extraValue, price, quantity);
      });
    })), document.querySelectorAll(".free-sauce-checkbox").forEach(freeSauceCheckbox => {

      freeSauceCheckbox.addEventListener("change", function() {
        const freeSauceSelect = document.getElementById("free_sauce_" + this.id);
        this.checked ? freeSauceSelect.classList.remove("d-none") : freeSauceSelect.classList.add("d-none"), freeSauceSelect.querySelector('select').addEventListener("change", function() {

          submitExtraSelection(this.value, this.options[this.selectedIndex].text, 0, 1);
        });
      });
    });
  }), document.addEventListener('DOMContentLoaded', function() {
    const drinkCheckboxes = document.querySelectorAll("input[name=\"boissons\"]");

    function submitDrinkSelection(drinkId, drinkName, drinkPrice, drinkQuantity) {

      var csrfToken = getCsrfToken();
      const drinkData = {
        'id': drinkId,
        'name': drinkName,
        'price': drinkPrice,
        'quantity': drinkQuantity
      };
      fetch('ajax/ubs.php', {
        'method': 'POST',
        'headers': {
          'X-CSRF-Token': csrfToken
        },
        'body': JSON.stringify(drinkData)
      }).then(response => response.json()).then(result => {
        refreshCartSummary();
      }).catch(error => console.error("Error:", error));
    }
    const csrfToken = getCsrfToken();
    fetch("ajax/gsb.php", {
      'method': "POST",
      'headers': {
        'X-CSRF-Token': csrfToken
      }
    }).then(response => {

      if (!response.ok) throw 403 === response.status && console.log('GSB REFRESH'), new Error('GSB Network response was not ok');
      return response.json();
    }).then(selectedDrinks => {

      Object.values(selectedDrinks).forEach(drink => {
        const drinkCheckbox = document.getElementById(drink.id);
        if (drinkCheckbox) {
          drinkCheckbox.checked = true;
          const quantityControl = drinkCheckbox.closest(".form-check").querySelector('.boisson-quantity-control');
          quantityControl.classList.remove("d-none"), quantityControl.querySelector(".quantity-input").value = drink.quantity;
        }
      });
    }).catch(error => console.error("Error:", error)), drinkCheckboxes.forEach(drinkCheckbox => {

      drinkCheckbox.addEventListener('change', function() {
        const quantityControl = this.closest(".form-check").querySelector('.boisson-quantity-control');
        this.checked ? quantityControl.classList.remove("d-none") : (quantityControl.classList.add("d-none"), quantityControl.querySelector('.quantity-input').value = 1);
        const quantity = this.checked ? parseInt(quantityControl.querySelector(".quantity-input").value, 10) : 0,
          drinkId = this.id,
          drinkValue = this.getAttribute('value'),
          priceText = this.closest('.form-check').querySelector(".boissons-info").textContent;
        submitDrinkSelection(drinkId, drinkValue, parseFloat(priceText.replace("CHF ", '')) || 0.5, quantity);
      });
    }), document.querySelectorAll('.boisson-quantity-control .increase, .boisson-quantity-control .decrease').forEach(button => {

      button.addEventListener("click", function() {
        const quantityInput = this.closest('.boisson-quantity-control').querySelector(".quantity-input");
        let quantity = parseInt(quantityInput.value, 10);
        quantity += this.classList.contains("increase") ? 1 : quantity > 1 ? -1 : 0, quantityInput.value = quantity;
        const drinkId = this.closest(".boisson-quantity-control").getAttribute("data-boisson-id"),
          drinkCheckbox = document.getElementById(drinkId),
          drinkValue = drinkCheckbox.getAttribute("value"),
          priceText = drinkCheckbox.closest(".form-check").querySelector(".boissons-info").textContent;
        submitDrinkSelection(drinkId, drinkValue, parseFloat(priceText.replace("CHF ", '')) || 0.5, quantity);
      });
    });
  }), document.addEventListener('DOMContentLoaded', function() {
    const dessertCheckboxes = document.querySelectorAll("input[name=\"desserts\"]");

    function submitDessertSelection(dessertId, dessertName, dessertPrice, dessertQuantity) {

      var csrfToken = getCsrfToken();
      const dessertData = {
        'id': dessertId,
        'name': dessertName,
        'price': dessertPrice,
        'quantity': dessertQuantity
      };
      fetch("ajax/uds.php", {
        'method': "POST",
        'headers': {
          'X-CSRF-Token': csrfToken
        },
        'body': JSON.stringify(dessertData)
      }).then(response => response.json()).then(result => {
        refreshCartSummary();
      }).catch(error => console.error("Error:", error));
    }
    const csrfToken = getCsrfToken();
    fetch("ajax/gsd.php", {
      'method': "POST",
      'headers': {
        'X-CSRF-Token': csrfToken
      }
    }).then(response => {

      if (!response.ok) throw 403 === response.status && console.log('GSD REFRESH'), new Error("GSD Network response was not ok");
      return response.json();
    }).then(selectedDesserts => {

      Object.values(selectedDesserts).forEach(dessert => {
        const dessertCheckbox = document.getElementById(dessert.id);
        if (dessertCheckbox) {
          dessertCheckbox.checked = true;
          const quantityControl = dessertCheckbox.closest('.form-check').querySelector(".dessert-quantity-control");
          quantityControl.classList.remove('d-none'), quantityControl.querySelector('.quantity-input').value = dessert.quantity;
        }
      });
    }).catch(error => console.error('Error:', error)), dessertCheckboxes.forEach(dessertCheckbox => {

      dessertCheckbox.addEventListener("change", function() {
        const quantityControl = this.closest(".form-check").querySelector(".dessert-quantity-control");
        this.checked ? quantityControl.classList.remove("d-none") : (quantityControl.classList.add("d-none"), quantityControl.querySelector(".quantity-input").value = 1);
        const quantity = this.checked ? parseInt(quantityControl.querySelector('.quantity-input').value, 10) : 0,
          dessertId = this.id,
          dessertValue = this.getAttribute('value'),
          priceText = this.closest('.form-check').querySelector(".desserts-info").textContent;
        submitDessertSelection(dessertId, dessertValue, parseFloat(priceText.replace('CHF ', '')) || 0.5, quantity);
      });
    }), document.querySelectorAll(".dessert-quantity-control .increase, .dessert-quantity-control .decrease").forEach(button => {

      button.addEventListener("click", function() {
        const quantityInput = this.closest(".dessert-quantity-control").querySelector(".quantity-input");
        let quantity = parseInt(quantityInput.value, 10);
        quantity += this.classList.contains('increase') ? 1 : quantity > 1 ? -1 : 0, quantityInput.value = quantity;
        const dessertId = this.closest(".dessert-quantity-control").getAttribute("data-dessert-id"),
          dessertCheckbox = document.getElementById(dessertId),
          dessertValue = dessertCheckbox.getAttribute("value"),
          priceText = dessertCheckbox.closest(".form-check").querySelector(".desserts-info").textContent;
        submitDessertSelection(dessertId, dessertValue, parseFloat(priceText.replace('CHF ', '')) || 0.5, quantity);
      });
    });
  }), document.addEventListener('DOMContentLoaded', refreshCategoryBadges), document.addEventListener("DOMContentLoaded", refreshCartSummary), document.addEventListener("DOMContentLoaded", function() {

    document.getElementById("orderModal").addEventListener("show.bs.modal", function(event) {

      var csrfToken = getCsrfToken();
      fetch("ajax/os.php", {
        'method': 'POST',
        'headers': {
          'Content-Type': "application/x-www-form-urlencoded"
        },
        'body': "csrf_token=" + encodeURIComponent(csrfToken)
      }).then(response => {

        if (!response.ok) throw 403 === response.status && console.log("OS REFRESH"), new Error("Network response was not ok");
        return response.text();
      }).then(html => {
        document.querySelector('#orderModal .order-summary').innerHTML = html;
      }).catch(error => console.error('Error loading the order summary:', error));
    });
  }), document.getElementById("selectProduct").addEventListener('change', function() {

    toggleTacoOptionsBySize(this.value, "add_");
  }), document.getElementById("tacosEditModal").addEventListener("show.bs.modal", function() {

    toggleTacoOptionsBySize(document.getElementById("editTaille").value, "edit_");
  }), document.addEventListener("DOMContentLoaded", function() {

    document.querySelector("#confirmMinOrderModal .btn-danger").addEventListener("click", function() {

      new bootstrap.Modal(document.getElementById('confirmMinOrderModal')).hide(), setTimeout(function() {

        new bootstrap[("Modal")](document.getElementById("orderModal")).show();
      }, 500);
    });
  }), document.addEventListener("DOMContentLoaded", function() {
    const selectProduct = document.getElementById("selectProduct");

    function setInputsDisabled(inputs, disabled = true) {

      inputs.forEach(input => {

        input.disabled = disabled, disabled && (input.checked = false);
      });
    }

    function enforceMeatSelectionLimit(meatLimit) {

      let selectedMeatsCount = [...meatCheckboxes].filter(checkbox => checkbox.checked).length;
      meatCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', () => {

          selectedMeatsCount = [...meatCheckboxes].filter(checkbox => checkbox.checked).length, selectedMeatsCount >= meatLimit ? setInputsDisabled([...meatCheckboxes].filter(checkbox => !checkbox.checked), true) : setInputsDisabled(meatCheckboxes, false);
        });
      });
    }
    meatCheckboxes = document.querySelectorAll("input[name=\"viande[]\"]"), sauceCheckboxes = document.querySelectorAll("input[name=\"sauce[]\"]"), garnishCheckboxes = document.querySelectorAll("input[name=\"garniture[]\"]"), selectProduct.addEventListener('change', () => {

      [...meatCheckboxes, ...sauceCheckboxes, ...garnishCheckboxes].forEach(checkbox => {

        checkbox.checked = false;
      });
      const tacoSize = selectProduct.value;
      switch (setInputsDisabled(meatCheckboxes, false), setInputsDisabled(sauceCheckboxes, false), setInputsDisabled(garnishCheckboxes, false), tacoSize) {
        case 'tacos_L':
          enforceMeatSelectionLimit(1);
          break;
        case "tacos_BOWL":
          enforceMeatSelectionLimit(2);
          break;
        case "tacos_L_mixte":
        case "tacos_XL":
          enforceMeatSelectionLimit(3);
          break;
        case 'tacos_XXL':
          enforceMeatSelectionLimit(4);
          break;
        case "tacos_GIGA":
          enforceMeatSelectionLimit(5);
          break;
        default:
          setInputsDisabled(meatCheckboxes, true), setInputsDisabled(sauceCheckboxes, true), setInputsDisabled(garnishCheckboxes, true);
      }
      sauceCheckboxes.forEach(checkbox => {

        checkbox.addEventListener("change", () => {

          [...sauceCheckboxes].filter(checkbox => checkbox.checked).length >= 3 ? setInputsDisabled([...sauceCheckboxes].filter(checkbox => !checkbox.checked), true) : setInputsDisabled(sauceCheckboxes, false);
        });
      });
    }), (document.querySelectorAll(".add-tacos-button").forEach(button => {

      button.addEventListener("click", function(event) {

        event.preventDefault(), !async function(tacoType) {

          new bootstrap[("Modal")](document.getElementById("tacosAddModal"), {
            'keyboard': false
          }).show(), document.getElementById("selectProduct").value = tacoType, selectProduct.dispatchEvent(new Event('change', {
            'bubbles': true,
            'cancelable': true
          })), await fetchStockAvailability(), applyStockAvailability();
        }(this.getAttribute("data-tacos-type"));
      });
    }), setInputsDisabled(meatCheckboxes), setInputsDisabled(sauceCheckboxes), setInputsDisabled(garnishCheckboxes), $("#tacosAddModal").on("hidden.bs.modal", function() {

      resetTacoForm(), selectProduct.value = 'null', setInputsDisabled(meatCheckboxes, true), setInputsDisabled(sauceCheckboxes, true), setInputsDisabled(garnishCheckboxes, true);
    }));
  }), $('#tacosForm').submit(function(event) {

    event.preventDefault();
    const selectedTacoSize = document.getElementById("selectProduct").value,
      selectedMeats = document.querySelectorAll("input[name=\"viande[]\"]:checked"),
      selectedSauces = document.querySelectorAll("input[name=\"sauce[]\"]:checked"),
      selectedGarnitures = document.querySelectorAll("input[name=\"garniture[]\"]:checked");
    document.querySelector("input[name=\"viande[]\"][value=\"sans\"]:checked"), document.querySelector('input[name="sauce[]"][value="sans"]:checked'), document.querySelector("input[name=\"garniture[]\"][value=\"sans\"]:checked");
    if (0 === selectedMeats.length) return alert("Veuillez s\u00e9lectionner au moins une viande ou cocher \"sans viande\"."), false;
    if (0 === selectedSauces.length) return alert("Veuillez s\u00e9lectionner au moins une sauce ou cocher \"sans sauce\"."), false;
    if ("tacos_BOWL" !== selectedTacoSize && 0 === selectedGarnitures.length) return alert('Veuillez sélectionner au moins une garniture ou cocher "sans garniture".'), false;
    var csrfToken = getCsrfToken();
    const meatQuantities = {};
    selectedMeats.forEach(meatCheckbox => {
      const meatValue = meatCheckbox.value,
        meatRow = meatCheckbox.closest(".meat-selection-row"),
        quantityInput = meatRow ? meatRow.querySelector(".meat-quantity-input") : null,
        quantity = quantityInput && parseInt(quantityInput.value, 10) || 1;
      meatQuantities[meatValue] = quantity;
    });
    let serializedData = $(this).serialize();
    Object.keys(meatQuantities).forEach(meatValue => {

      serializedData += "&meat_quantity[" + meatValue + ']=' + meatQuantities[meatValue];
    }), $.ajax({
      'type': 'POST',
      'url': "ajax/owt.php",
      'headers': {
        'X-CSRF-Token': csrfToken
      },
      'data': serializedData,
      'success': function(html) {

        $("#products-list").append(html), $("#product-messages").empty(), loadExistingTacos(), refreshTacoListUI(), refreshCartSummary();
      },
      'error': function() {
        alert('Error on submit. Please try again.');
      }
    }), $("#tacosAddModal").modal('hide'), resetTacoForm();
  }), $(document).on("click", ".delete-tacos", function(event) {

    event.preventDefault();
    var tacoIndex = $(this).attr('data-index');
    if (confirm("\u00cates-vous s\u00fbr de vouloir supprimer ce produit\u00a0?")) {
      var csrfToken = getCsrfToken();
      $.ajax({
        'url': "ajax/dt.php",
        'headers': {
          'X-CSRF-Token': csrfToken
        },
        'type': "POST",
        'data': {
          'index': tacoIndex
        },
        'success': function(result) {

          $('#tacos-' + tacoIndex).remove(), refreshTacoListUI(), refreshCartSummary();
        },
        'error': function() {
          alert('Error on delete. Please try again.');
        }
      });
    }
  }), $(document).ready(function() {
    loadExistingTacos();
  }), document.getElementById("orderForm").addEventListener("submit", function(event) {

    event.preventDefault();
    const finalizeButton = document.getElementById('finalizeButton'),
      originalButtonText = finalizeButton ? finalizeButton.innerHTML : 'Finaliser la commande';
    if (document.getElementById("phone").value !== document.getElementById("confirmPhone").value) return void alert("Les num\u00e9ros de t\u00e9l\u00e9phone ne correspondent pas, veuillez v\u00e9rifier !");
    finalizeButton && (finalizeButton.disabled = true, finalizeButton.innerHTML = "<span class=\"spinner-border spinner-border-sm me-2\"></span>Traitement en cours...", finalizeButton.classList.add("disabled"));
    const transactionId = Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      csrfToken = getCsrfToken();
    var formData = new FormData(this);
    formData.append("transaction_id", transactionId), fetch("ajax/RocknRoll.php", {
      'method': "POST",
      'headers': {
        'X-CSRF-Token': csrfToken
      },
      'body': formData
    }).then(response => {

      if (!response.ok) {
        if (409 === response.status) return response.json().then(data => {
          throw new Error('DUPLICATE_ORDER');
        });
        if (403 === response.status) return response.text().then(text => {

          if (text.includes('1 Order per minute') || text.includes("Maximum")) throw new Error("RATE_LIMIT");
          throw new Error("FORBIDDEN");
        });
        throw new Error('RocknRoll Network response was not ok');
      }
      return response.json();
    }).then(orderResult => {

      if (!orderResult) throw console.error("Unexpected response structure:", orderResult), new Error("Error during order processing");
      {
        finalizeButton && (finalizeButton.classList.remove("btn-danger"), finalizeButton.classList.add("btn-success"), finalizeButton.innerHTML = "<i class=\"fas fa-check me-2\"></i>Commande confirm\u00e9e!"), localStorage.removeItem("accordionState"), document.querySelectorAll(".collapse.show").forEach(collapseElement => {

          new bootstrap[("Collapse")](collapseElement, {
            'toggle': false
          }).hide();
        });
        var orderStories = localStorage.getItem('order_stories');
        (orderStories = orderStories ? JSON.parse(orderStories) : []).push(orderResult), localStorage.setItem('order_stories', JSON.stringify(orderStories));
        let successMessage = '';
        "livraison" === new URLSearchParams(window.location.search).get("content") ? successMessage = '<div class="d-flex justify-content-center align-items-center" style="height: 100px;"><i class='fa fa-check-circle' style='color: green; font-size: 100px;'></i></div><br />Votre commande a été reçue et sera préparée.<br>Restez joignable s'il vous plaît.<br>Celui-ci sera mis à jour lorsque votre commande sera en route.' : "emporter" === new URLSearchParams(window.location.search)["get"]("content") && (successMessage = "<div class=\"d-flex justify-content-center align-items-center\" style=\"height: 100px;\"><i class='fa fa-check-circle' style='color: green; font-size: 100px; margin-right: 15px;'></i>Votre commande a \u00e9t\u00e9 re\u00e7ue et sera pr\u00e9par\u00e9e.</div>"), $("#orderModal").on("hidden.bs.modal", function() {

          $('#successModalBody').html(successMessage), $("#successModal").modal("show");
        }).modal("hide"), $('#successModal').on("hidden.bs.modal", function() {

          window.location.reload();
        }), gtag("event", 'purchase', {
          'transaction_id': orderResult.orderId,
          'affiliation': "Website",
          'value': orderResult.OrderData.price,
          'currency': "CHF"
        });
      }
    }).catch(error => {

      "undefined" != typeof isDevMode && isDevMode && (console.error("Error type:", error.name), console.error('Error message:', error.message), console.error('Error stack:', error.stack)), finalizeButton && ("DUPLICATE_ORDER" === error.message ? (finalizeButton.classList.remove("btn-danger"), finalizeButton.classList.add('btn-info'), finalizeButton.innerHTML = "<i class=\"fas fa-info-circle me-2\"></i>Cette commande a d\u00e9j\u00e0 \u00e9t\u00e9 trait\u00e9e", setTimeout(() => {

        finalizeButton.disabled = false, finalizeButton.classList.remove('btn-info', "disabled"), finalizeButton.classList.add("btn-danger"), finalizeButton.innerHTML = originalButtonText;
      }, 3000)) : "RATE_LIMIT" === error.message ? (finalizeButton.classList.remove('btn-danger'), finalizeButton.classList.add("btn-warning"), finalizeButton.innerHTML = '<i class="fas fa-exclamation-triangle me-2"></i>Veuillez patienter 1 minute', setTimeout(() => {

        finalizeButton.disabled = false, finalizeButton.classList.remove('btn-warning', "disabled"), finalizeButton.classList.add("btn-danger"), finalizeButton.innerHTML = originalButtonText;
      }, 5000)) : error.message.includes("Network") ? (finalizeButton.classList.add("btn-danger"), finalizeButton.innerHTML = "<i class=\"fas fa-wifi me-2\"></i>Erreur de connexion", setTimeout(() => {

        finalizeButton.disabled = false, finalizeButton.classList.remove("disabled"), finalizeButton.innerHTML = originalButtonText;
      }, 3000)) : (finalizeButton.classList.add('btn-danger'), finalizeButton.innerHTML = "<i class=\"fas fa-times me-2\"></i>Erreur - Veuillez r\u00e9essayer", setTimeout(() => {

        finalizeButton.disabled = false, finalizeButton.classList.remove('disabled'), finalizeButton.innerHTML = originalButtonText;
      }, 3000))), "RATE_LIMIT" === error.message ? alert("Vous avez d\u00e9j\u00e0 pass\u00e9 une commande r\u00e9cemment. Veuillez patienter 1 minute avant de commander \u00e0 nouveau.") : "FORBIDDEN" === error.message ? alert("Acc\u00e8s refus\u00e9. Veuillez r\u00e9essayer.") : error.message.includes("Network") ? alert("Probl\u00e8me de connexion. V\u00e9rifiez votre connexion internet et r\u00e9essayez.") : alert("Une erreur est survenue lors de la soumission du formulaire. Veuillez r\u00e9essayer.");
    });
  }), document.addEventListener("DOMContentLoaded", function() {
    const addToHomeText = document.getElementById("addToHomeText"),
      bannerLogo = document.getElementById("bannerLogo"),
      userAgent = navigator.userAgent.toLowerCase();

    function updateAddToHomePrompt(text, imageSrc) {
      addToHomeText.textContent = text, bannerLogo.src = imageSrc;
    }
    /iphone|ipad/ .test(userAgent) ? updateAddToHomePrompt("Appuyez sur l\u2019ic\u00f4ne de partage (en bas au centre) et s\u00e9lectionnez \u00ab Ajouter \u00e0 l\u2019\u00e9cran d\u2019accueil \u00bb.", './images/ios-share.png'): /android/ .test(userAgent) && updateAddToHomePrompt("Dans le menu du navigateur (en haut \u00e0 droite), s\u00e9lectionnez \u00ab Ajouter \u00e0 l\u2019\u00e9cran d\u2019accueil \u00bb.", "./images/android-share.png");
  });
  let maxMeatPortions = 1;

  function handleFreeSauceSelectionChange(event) {
    const freeSauceContainer = event.target.closest(".free-sauces-container");
    freeSauceContainer && submitExtraSelectionWithSauces(freeSauceContainer.id.replace("free_sauce_select_", ''));
  }

  function submitExtraSelectionWithSauces(extraId) {
    const extraCheckbox = document.getElementById(extraId),
      quantityInput = extraCheckbox.closest('.form-check').querySelector(".quantity-input"),
      quantity = parseInt(quantityInput.value, 10),
      extraValue = extraCheckbox.getAttribute('value'),
      priceText = extraCheckbox.closest('.form-check').querySelector(".extras-info").textContent,
      price = parseFloat(priceText.replace("CHF ", '')) || 0.5,
      sauceSelects = document.querySelectorAll("#free_sauce_select_" + extraId + " select"),
      selectedSauces = [];
    sauceSelects.forEach(select => {

      if (select.value) {
        const sauceName = select.options[select.selectedIndex].text;
        selectedSauces.push({
          'id': select.value,
          'name': sauceName,
          'price': 0
        });
      }
    }), submitExtraSelection(extraId, extraValue, price, quantity, null, null, selectedSauces);
  }
  document.addEventListener("DOMContentLoaded", function() {
    const selectProduct = document.getElementById("selectProduct"),
      meatCheckboxes = document.querySelectorAll("input[name=\"viande[]\"]"),
      sauceCheckboxes = document.querySelectorAll("input[name=\"sauce[]\"]"),
      garnitureCheckboxes = document.querySelectorAll("input[name=\"garniture[]\"]");

    function enforceMeatQuantityLimits() {
      const checkedMeats = [...meatCheckboxes].filter(checkbox => checkbox.checked);
      let totalMeatPortions = 0;
      1 === maxMeatPortions ? totalMeatPortions = checkedMeats.length : checkedMeats.forEach(meatCheckbox => {
        const meatRow = meatCheckbox.closest(".meat-selection-row");
        if (meatRow) {
          const quantityInput = meatRow.querySelector(".meat-quantity-input"),
            quantity = parseInt(quantityInput?.value || 1);
          totalMeatPortions += quantity;
        }
      }), meatCheckboxes.forEach(meatCheckbox => {

        meatCheckbox.checked || (meatCheckbox.disabled = totalMeatPortions >= maxMeatPortions);
      }), checkedMeats.forEach(meatCheckbox => {
        const meatRow = meatCheckbox.closest(".meat-selection-row");
        if (meatRow) {
          const quantityInput = meatRow.querySelector(".meat-quantity-input");
          if (quantityInput) {
            const currentQuantity = parseInt(quantityInput.value),
              maxAllowed = maxMeatPortions - totalMeatPortions + currentQuantity;
            quantityInput.max = Math.min(maxAllowed, 5), currentQuantity > quantityInput.max && (quantityInput.value = quantityInput.max);
          }
        }
      });
    }
    meatCheckboxes.forEach(meatCheckbox => {

      meatCheckbox.addEventListener("change", function() {
        const meatRow = this.closest('.meat-selection-row');
        if (meatRow) {
          const quantityControl = meatRow.querySelector(".meat-quantity-control");
          if (quantityControl) {
            if (this.checked && maxMeatPortions > 1) quantityControl.classList.remove('d-none'), enforceMeatQuantityLimits();
            else {
              quantityControl.classList.add("d-none");
              const quantityInput = quantityControl.querySelector(".meat-quantity-input");
              quantityInput && (quantityInput.value = 1);
            }
          }
        }
        enforceMeatQuantityLimits();
      });
    }), document.querySelectorAll(".increase-meat").forEach(increaseButton => {

      increaseButton.addEventListener('click', function() {
        const quantityInput = this.parentElement.querySelector(".meat-quantity-input");
        if (quantityInput) {
          const quantity = parseInt(quantityInput.value) || 1;
          quantity < (parseInt(quantityInput.max) || maxMeatPortions) && (quantityInput.value = quantity + 1, enforceMeatQuantityLimits());
        }
      });
    }), document.querySelectorAll(".decrease-meat").forEach(decreaseButton => {

      decreaseButton.addEventListener("click", function() {
        const quantityInput = this.parentElement.querySelector(".meat-quantity-input");
        if (quantityInput) {
          const quantity = parseInt(quantityInput.value) || 1;
          quantity > 1 && (quantityInput.value = quantity - 1, enforceMeatQuantityLimits());
        }
      });
    }), sauceCheckboxes.forEach(sauceCheckbox => {

      sauceCheckbox.addEventListener("change", function() {

        [...sauceCheckboxes].filter(checkbox => checkbox.checked).length >= 3 ? [...sauceCheckboxes].filter(checkbox => !checkbox.checked).forEach(checkbox => checkbox.disabled = true) : sauceCheckboxes.forEach(checkbox => {

          checkbox.checked || (checkbox.disabled = false);
        });
      });
    }), selectProduct && (selectProduct.addEventListener('change', function() {
      const tacoSize = this.value;
      switch ([...meatCheckboxes, ...sauceCheckboxes, ...garnitureCheckboxes].forEach(checkbox => {

          checkbox.checked = false, checkbox.disabled = false;
        }), document.querySelectorAll(".meat-quantity-control").forEach(quantityControl => {

          quantityControl.classList.add("d-none");
          const quantityInput = quantityControl.querySelector('.meat-quantity-input');
          quantityInput && (quantityInput.value = 1);
        }), tacoSize) {
        case "tacos_L":
          maxMeatPortions = 1;
          break;
        case "tacos_BOWL":
          maxMeatPortions = 2;
          break;
        case "tacos_L_mixte":
        case 'tacos_XL':
          maxMeatPortions = 3;
          break;
        case 'tacos_XXL':
          maxMeatPortions = 4;
          break;
        case "tacos_GIGA":
          maxMeatPortions = 5;
          break;
        default:
          return maxMeatPortions = 0, void[...meatCheckboxes, ...sauceCheckboxes, ...garnitureCheckboxes].forEach(checkbox => checkbox.disabled = true);
      } [...meatCheckboxes, ...sauceCheckboxes, ...garnitureCheckboxes].forEach(checkbox => checkbox.disabled = false);
    }), [...meatCheckboxes, ...sauceCheckboxes, ...garnitureCheckboxes].forEach(checkbox => checkbox.disabled = true)), $("#tacosAddModal").on("hidden.bs.modal", function() {

      selectProduct && (selectProduct.value = "null", [...meatCheckboxes, ...sauceCheckboxes, ...garnitureCheckboxes].forEach(checkbox => {

        checkbox.checked = false, checkbox.disabled = true;
      }), document.querySelectorAll(".meat-quantity-control").forEach(quantityControl => {

        quantityControl.classList.add("d-none");
        const quantityInput = quantityControl.querySelector('.meat-quantity-input');
        quantityInput && (quantityInput.value = 1);
      }), maxMeatPortions = 0);
    });
  }), document.addEventListener("DOMContentLoaded", function() {

    document.querySelectorAll("#tacosEditForm input[name=\"viande[]\"]").forEach(meatCheckbox => {

      meatCheckbox.addEventListener("change", function() {
        const meatRow = this.closest(".meat-selection-row");
        if (meatRow) {
          const quantityControl = meatRow.querySelector('.meat-quantity-control');
          if (quantityControl) {
            let maxMeats = 1;
            switch (document.getElementById("editSelectProduct").value) {
              case "tacos_L":
                maxMeats = 1;
                break;
              case "tacos_L_mixte":
              case "tacos_XL":
                maxMeats = 3;
                break;
              case "tacos_XXL":
                maxMeats = 4;
                break;
              case "tacos_GIGA":
                maxMeats = 5;
            }
            const quantityInput = quantityControl.querySelector('.meat-quantity-input');
            this.checked && maxMeats > 1 ? (quantityControl.classList.remove("d-none"), quantityInput && (quantityInput.disabled = false)) : (quantityControl.classList.add("d-none"), quantityInput && (quantityInput.value = 1, quantityInput.disabled = true));
          }
        }
      });
    }), document.querySelectorAll("#tacosEditForm .increase-meat").forEach(increaseButton => {

      increaseButton.addEventListener("click", function() {
        const quantityInput = this.parentElement.querySelector(".meat-quantity-input");
        if (quantityInput) {
          const quantity = parseInt(quantityInput.value) || 1;
          quantity < (parseInt(quantityInput.max) || 5) && (quantityInput.value = quantity + 1);
        }
      });
    }), document.querySelectorAll("#tacosEditForm .decrease-meat").forEach(decreaseButton => {

      decreaseButton.addEventListener("click", function() {
        const quantityInput = this.parentElement.querySelector(".meat-quantity-input");
        if (quantityInput) {
          const quantity = parseInt(quantityInput.value) || 1;
          quantity > 1 && (quantityInput.value = quantity - 1);
        }
      });
    });
  }), document.addEventListener('DOMContentLoaded', function() {

    try {
      if (!window.location.search.includes("content=livraison")) return;
      const timeSelect = document.querySelector('select[name="requestedFor"]'),
        warningBanner = document.getElementById("deliveryDemandWarning"),
        warningMessage = document.getElementById("demandMessage");
      if (timeSelect && warningBanner && warningMessage) {
        let hasInitialized = false;
        timeSelect.addEventListener("change", function() {
          const selectedTime = this.value;
          selectedTime && '' !== selectedTime ? updateDeliveryDemandBanner(selectedTime) : warningBanner.classList.add('d-none');
        }), timeSelect.value && '' !== timeSelect.value && updateDeliveryDemandBanner(timeSelect.value);
        const orderModal = document.querySelector("#orderModal");
        orderModal && orderModal.addEventListener('shown.bs.modal', function() {
          hasInitialized || (!(function() {
            const timeSelect = document.querySelector("select[name=\"requestedFor\"]");
            if (!timeSelect) return;
            const csrfToken = document.querySelector("input[name=\"csrf_token\"]")?.value || '';
            fetch('ajax/check_delivery_demand.php', {
              'method': "POST",
              'headers': {
                'Content-Type': "application/json",
                'X-CSRF-TOKEN': csrfToken
              },
              'body': JSON.stringify({
                'check_all': true
              })
            }).then(response => response.json()).then(data => {

              'success' === data.status && data.time_slots && timeSelect.querySelectorAll("option[value]:not([value=\"\"])").forEach(option => {
                const timeValue = option.value,
                  timeVariants = [timeValue, timeValue + ":00"];
                let isHighDemand = false;
                for (const timeVariant of timeVariants)
                  if (data.time_slots[timeVariant] && data.time_slots[timeVariant]["is_high_demand"]) {
                    isHighDemand = true;
                    break;
                  } if (isHighDemand && !option.textContent.includes("Forte affluence")) {
                  const originalText = option.textContent;
                  option.textContent = originalText + " (Forte affluence)", option.style.color = '#dc3545', option.classList.add('high-demand');
                }
              });
            }).catch(error => {

              console.error("Error checking all time slots:", error);
            });
          }()), hasInitialized = true);
        });
      }

      function updateDeliveryDemandBanner(selectedTime) {
        const csrfToken = document.querySelector("input[name=\"csrf_token\"]")?.value || '';
        fetch("ajax/check_delivery_demand.php", {
          'method': "POST",
          'headers': {
            'Content-Type': "application/json",
            'X-CSRF-TOKEN': csrfToken
          },
          'body': JSON.stringify({
            'time': selectedTime
          })
        }).then(function(response) {

          return response.json();
        }).then(function(data) {

          "success" === data.status ? data.is_high_demand ? (warningMessage.textContent = data.message, warningBanner.classList.remove("d-none")) : warningBanner.classList.add("d-none") : console.error("Delivery demand check error:", data.message);
        }).catch(function(error) {

          console.error("Error:", error);
        });
      }
    } catch (error) {
      console.error("Delivery demand initialization error:", error);
    }
  });
  let stockCache = null,
    cacheTimestamp = 0;
  const CACHE_DURATION = 30000;
  async function fetchStockAvailability() {
    const currentTime = Date.now();
    if (stockCache && currentTime - cacheTimestamp < CACHE_DURATION) return stockCache;
    try {
      const response = await fetch("/office/stock_management.php?type=all");
      if (!response.ok) throw new Error("Stock status fetch failed");
      const stockData = await response.json();
      return stockCache = stockData, cacheTimestamp = currentTime, stockData;
    } catch (error) {
      return console.error('Stock status fetch error:', error), null;
    }
  }

  function isStockAvailable(category, itemId) {

    if (!stockCache || !stockCache[category]) return true;
    const stockItem = stockCache[category][itemId];
    return !stockItem || stockItem.in_stock;
  }

  function applyStockAvailability() {

    stockCache && (document.querySelectorAll("input[name=\"viande\"], input[name=\"viande[]\"]").forEach(meatInput => {
      const isAvailable = isStockAvailable("viandes", meatInput.value),
        labelElement = meatInput.closest("label") || meatInput.parentElement,
        containerElement = meatInput.closest(".meat-selection-row") || meatInput.closest('.form-check');
      if (isAvailable) {
        if (meatInput.disabled = false, containerElement && (containerElement.style.opacity = '1', containerElement.style.pointerEvents = "auto"), labelElement) {
          const outOfStockText = labelElement.querySelector(".out-of-stock-text");
          outOfStockText && outOfStockText.remove();
        }
      } else {
        if (meatInput.disabled = true, meatInput.checked = false, containerElement && (containerElement.style.opacity = "0.5", containerElement.style.pointerEvents = 'none'), labelElement) {
          if (!labelElement.querySelector(".out-of-stock-text")) {
            const outOfStockSpan = document.createElement("span");
            outOfStockSpan.className = 'out-of-stock-text text-danger ms-2 fw-bold', outOfStockSpan.textContent = " (Temporairement \u00e9puis\u00e9)", labelElement.appendChild(outOfStockSpan);
          }
        }
      }
    }), document.querySelectorAll("input[name^=\"garniture\"]").forEach(garnitureInput => {
      const isAvailable = isStockAvailable('garnitures', garnitureInput.value),
        labelElement = garnitureInput.closest("label") || garnitureInput.parentElement.querySelector("label");
      if (isAvailable) {
        if (garnitureInput.disabled = false, labelElement) {
          const outOfStockText = labelElement.querySelector(".out-of-stock-text");
          outOfStockText && outOfStockText.remove();
        }
      } else {
        if (garnitureInput.disabled = true, labelElement) {
          if (!labelElement.querySelector(".out-of-stock-text")) {
            const outOfStockSpan = document.createElement("span");
            outOfStockSpan.className = "out-of-stock-text text-danger ms-2", outOfStockSpan.textContent = "(Temporairement \u00e9puis\u00e9)", labelElement.appendChild(outOfStockSpan);
          }
        }
      }
    }), document.querySelectorAll("input[name^=\"sauce\"]").forEach(sauceInput => {
      const isAvailable = isStockAvailable("sauces", sauceInput.value),
        labelElement = sauceInput.closest("label") || sauceInput.parentElement.querySelector("label");
      if (isAvailable) {
        if (sauceInput.disabled = false, labelElement) {
          const outOfStockText = labelElement.querySelector(".out-of-stock-text");
          outOfStockText && outOfStockText.remove();
        }
      } else {
        if (sauceInput.disabled = true, labelElement) {
          if (!labelElement.querySelector(".out-of-stock-text")) {
            const outOfStockSpan = document.createElement("span");
            outOfStockSpan.className = 'out-of-stock-text text-danger ms-2', outOfStockSpan.textContent = "(Temporairement \u00e9puis\u00e9)", labelElement.appendChild(outOfStockSpan);
          }
        }
      }
    }), document.querySelectorAll('input[name="dessert"]').forEach(dessertInput => {
      const isAvailable = isStockAvailable("desserts", dessertInput.value),
        labelElement = dessertInput.closest("label") || dessertInput.parentElement.querySelector("label");
      if (isAvailable) {
        if (dessertInput.disabled = false, labelElement) {
          const outOfStockText = labelElement.querySelector(".out-of-stock-text");
          outOfStockText && outOfStockText.remove();
        }
      } else {
        if (dessertInput.disabled = true, labelElement) {
          if (!labelElement.querySelector('.out-of-stock-text')) {
            const outOfStockSpan = document.createElement('span');
            outOfStockSpan.className = "out-of-stock-text text-danger ms-2", outOfStockSpan.textContent = "(Temporairement \u00e9puis\u00e9)", labelElement.appendChild(outOfStockSpan);
          }
        }
      }
    }), document.querySelectorAll("input[name=\"boisson\"]").forEach(drinkInput => {
      const isAvailable = isStockAvailable("boissons", drinkInput.value),
        labelElement = drinkInput.closest("label") || drinkInput.parentElement.querySelector("label");
      if (isAvailable) {
        if (drinkInput.disabled = false, labelElement) {
          const outOfStockText = labelElement.querySelector(".out-of-stock-text");
          outOfStockText && outOfStockText.remove();
        }
      } else {
        if (drinkInput.disabled = true, labelElement) {
          if (!labelElement.querySelector('.out-of-stock-text')) {
            const outOfStockSpan = document.createElement('span');
            outOfStockSpan.className = 'out-of-stock-text text-danger ms-2', outOfStockSpan.textContent = "(Temporairement \u00e9puis\u00e9)", labelElement.appendChild(outOfStockSpan);
          }
        }
      }
    }), document.querySelectorAll("input[name=\"extra[]\"]").forEach(extraInput => {
      const isAvailable = isStockAvailable("extras", extraInput.value),
        labelElement = extraInput.closest("label") || extraInput.parentElement.querySelector("label");
      if (isAvailable) {
        if (extraInput.disabled = false, labelElement) {
          const outOfStockText = labelElement.querySelector('.out-of-stock-text');
          outOfStockText && outOfStockText.remove();
        }
      } else {
        if (extraInput.disabled = true, labelElement) {
          if (!labelElement.querySelector(".out-of-stock-text")) {
            const outOfStockSpan = document.createElement("span");
            outOfStockSpan.className = "out-of-stock-text text-danger ms-2", outOfStockSpan.textContent = '(Temporairement épuisé)', labelElement.appendChild(outOfStockSpan);
          }
        }
      }
    }));
  }
  document.addEventListener('DOMContentLoaded', async function() {
    await fetchStockAvailability(), applyStockAvailability();
  }), document.querySelectorAll('.modal').forEach(modal => {

    modal.addEventListener("shown.bs.modal", async function() {
      await fetchStockAvailability(), applyStockAvailability();
    });
  }), (function() {
    const addressInput = document.getElementById("address"),
      autocompleteDropdown = document.getElementById("autocompleteDropdown");
    if (!addressInput || !autocompleteDropdown) return;
    let debounceTimer, activeIndex = -1,
      suggestions = [];

    function getPostalCodeFromSummary() {
      const postalCodeElement = document.querySelector('.col-4.mt-5.border.rounded .text-center.mt-1.small');
      if (postalCodeElement && 'N/A' !== postalCodeElement.textContent.trim()) {
        const postalCodeMatch = postalCodeElement.textContent.trim().match(/^(\d{4})/);
        return postalCodeMatch ? postalCodeMatch[1] : null;
      }
      return null;
    }

    function setActiveAutocompleteItem(index) {

      autocompleteDropdown.querySelectorAll(".autocomplete-item").forEach((item, itemIndex) => {

        item.classList.toggle("active", itemIndex === index);
      }), activeIndex = index;
    }

    function selectAutocompleteSuggestion(suggestion) {
      const streetName = suggestion.address?.road || suggestion.address?.pedestrian || '',
        houseNumber = suggestion.address?.house_number || '',
        addressParts = addressInput.value.trim().split(/\s+/),
        lastPart = addressParts[addressParts.length - 1],
        isNumeric = /^\d+$/ .test(lastPart);
      addressInput.value = houseNumber ? streetName + ' ' + houseNumber : isNumeric ? streetName + ' ' + lastPart : streetName, autocompleteDropdown.classList.remove("show"), setTimeout(() => {

        addressInput.focus();
        const selectionEnd = addressInput.value.length;
        addressInput.setSelectionRange(selectionEnd, selectionEnd);
      }, 100);
    }
    addressInput.addEventListener("input", function() {
      clearTimeout(debounceTimer), debounceTimer = setTimeout(async () => {
        const inputValue = addressInput.value.trim(),
          postalCode = getPostalCodeFromSummary();
        if (inputValue.length < 3) return void autocompleteDropdown.classList.remove("show");
        if (!postalCode) return void autocompleteDropdown.classList.remove("show");
        const results = await async function(street, postalCode) {
          if (!postalCode || street.length < 3) return [];
          const normalizedStreet = function(street) {
              const replacements = [{
                  'pattern': /\bchem\.\s*/gi,
                  'replacement': "Chemin "
                }, {
                  'pattern': /\bch\.\s*/gi,
                  'replacement': "Chemin "
                }, {
                  'pattern': /\bav\.\s*/gi,
                  'replacement': "Avenue "
                }, {
                  'pattern': /\bbd\s+/gi,
                  'replacement': 'Boulevard '
                }, {
                  'pattern': /\bpl\.\s*/gi,
                  'replacement': "Place "
                }, {
                  'pattern': /\brte\s+/gi,
                  'replacement': "Route "
                }, {
                  'pattern': /\br\.\s*/gi,
                  'replacement': 'Rue '
                }];
              let normalized = street;
              for (const {
                  pattern: pattern,
                  replacement: replacement
                }
                of replacements) normalized = normalized.replace(pattern, replacement);
              return normalized;
            }(street),
            apiUrl = "https://nominatim.openstreetmap.org/search?" + new URLSearchParams({
              'street': normalizedStreet,
              'postalcode': postalCode,
              'country': "Switzerland",
              'format': 'json',
              'addressdetails': '1',
              'limit': '10',
              'layer': "address"
            })["toString"]();
          try {
            const response = await fetch(apiUrl, {
              'headers': {
                'User-Agent': "Mozilla/5.0"
              }
            });
            return await response.json();
          } catch (error) {
            return console.error('Nominatim error:', error), [];
          }
        }(inputValue, postalCode);
        ! function(results) {
          const currentPostalCode = getPostalCodeFromSummary(),
            uniqueAddresses = new Map();
          results.forEach(result => {
            const streetName = result.address?.road || result.address?.pedestrian || '',
              resultPostalCode = result.address?.postcode || '';
            streetName && !uniqueAddresses.has(streetName) && (result._isExactMatch = resultPostalCode === currentPostalCode, uniqueAddresses.set(streetName, result));
          }), suggestions = Array.from(uniqueAddresses.values()).sort((resultA, resultB) => resultA._isExactMatch && !resultB._isExactMatch ? -1 : !resultA._isExactMatch && resultB._isExactMatch ? 1 : 0), activeIndex = -1, 0 !== suggestions.length ? (autocompleteDropdown.innerHTML = '', suggestions.forEach((suggestion, index) => {
            const itemElement = document.createElement('div');
            itemElement.className = "autocomplete-item", itemElement.dataset.index = index;
            const streetName = suggestion.address?.road || '',
              houseNumber = suggestion.address?.house_number || '',
              fullAddress = houseNumber ? streetName + ' ' + houseNumber : streetName;
            itemElement.innerHTML = "\n        <div class=\"street\">" + fullAddress + "</div>\n      ", itemElement.addEventListener("touchstart", event => {
              event.preventDefault(), selectAutocompleteSuggestion(suggestion);
            }), itemElement.addEventListener("click", event => {

              event.preventDefault(), selectAutocompleteSuggestion(suggestion);
            }), itemElement.addEventListener("mouseenter", () => setActiveAutocompleteItem(index)), autocompleteDropdown.appendChild(itemElement);
          }), autocompleteDropdown.classList.add('show')) : autocompleteDropdown.classList.remove("show");
        }(results);
      }, 300);
    }), addressInput.addEventListener("keydown", event => {
      const items = autocompleteDropdown.querySelectorAll(".autocomplete-item");
      "ArrowDown" === event.key ? (event.preventDefault(), activeIndex = Math.min(activeIndex + 1, items.length - 1), setActiveAutocompleteItem(activeIndex)) : "ArrowUp" === event.key ? (event.preventDefault(), activeIndex = Math.max(activeIndex - 1, 0), setActiveAutocompleteItem(activeIndex)) : 'Enter' === event.key ? activeIndex >= 0 && suggestions[activeIndex] && (event.preventDefault(), selectAutocompleteSuggestion(suggestions[activeIndex])) : "Escape" === event.key && autocompleteDropdown.classList.remove("show");
    }), document.addEventListener("click", event => {

      autocompleteDropdown.contains(event.target) || event.target === addressInput || autocompleteDropdown.classList.remove("show");
    });
  }());
})()));