<template>
  <div class="profile-navigation">
    <div
      class="nav-item"
      :class="{ active: activeSection === 'profil' }"
      @click="navigate('/profil')"
    >
      <div class="icon">👤</div>
      <span>Osobní údaje</span>
    </div>
    <div
      class="nav-item"
      :class="{ active: activeSection === 'objednavky' }"
      @click="navigate('/objednavky')"
    >
      <div class="icon">📦</div>
      <span>Moje objednávky</span>
    </div>
    <div
      class="nav-item"
      :class="{ active: activeSection === 'heslo' }"
      @click="navigate('/zmena-hesla')"
    >
      <div class="icon">🔐</div>
      <span>Změna hesla</span>
    </div>
    <div class="nav-item logout" @click="logout">
      <div class="icon">🚪</div>
      <span>Odhlásit se</span>
    </div>
  </div>
</template>

<script>
import { useUserStore } from '../stores'
import { useRouter } from 'vue-router'

export default {
  name: 'ProfileSidebar',
  props: {
    activeSection: {
      type: String,
      required: true
    }
  },
  setup(props) {
    const userStore = useUserStore()
    const router = useRouter()

    const navigate = (path) => {
      router.push(path)
    }

    const logout = () => {
      userStore.logout()
      router.push('/')
    }

    return {
      navigate,
      logout
    }
  }
}
</script>

<style scoped>
.profile-navigation {
  flex: 0 0 250px;
  background-color: #f8f8f8;
  padding: 20px 0;
}

.nav-item {
  display: flex;
  align-items: center;
  padding: 15px 20px;
  color: #555;
  cursor: pointer;
  transition:
    background-color 0.2s,
    color 0.2s;
  border-left: 3px solid transparent;
}

.nav-item:hover {
  background-color: #f0f0f0;
  color: #f5852a;
}

.nav-item.active {
  border-left-color: #f5852a;
  color: #f5852a;
  background-color: #fff5eb;
}

.nav-item .icon {
  margin-right: 15px;
  font-size: 20px;
}

.nav-item.logout {
  margin-top: 20px;
  border-top: 1px solid #eee;
  padding-top: 20px;
  color: #e53935;
}

.nav-item.logout:hover {
  background-color: #ffebee;
}

/* Responzivní design */
@media (max-width: 950px) {
  .profile-navigation {
    flex: none;
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
    padding: 10px;
  }

  .nav-item {
    flex: 1 1 calc(50% - 5px);
    padding: 10px;
    border-left: none;
    border-bottom: 3px solid transparent;
    justify-content: center;
    text-align: center;
  }

  .nav-item.active {
    border-left-color: transparent;
    border-bottom-color: #f5852a;
  }

  .nav-item .icon {
    margin-right: 8px;
  }

  .nav-item.logout {
    margin-top: 5px;
    border-top: none;
    padding-top: 10px;
  }
}

@media (max-width: 576px) {
  .profile-navigation {
    flex-direction: column;
  }

  .nav-item {
    flex: none;
    width: 100%;
  }
}
</style>
